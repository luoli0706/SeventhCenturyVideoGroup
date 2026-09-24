package controllers

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// 按客户端 IP 的令牌桶限流。
//
// IP 取值见 clientIP()：**刻意不读 X-Forwarded-For**。
//
// 分档：携带有效管理员 token 的请求走 adminPerMin，其余走 anonPerMin。
// 关键在于未授权的请求同样计数（限流要排在 RequireAdmin 之前），
// 否则拿不到 token 的探测者反而完全不受限。
//
// 每次调用 RateLimit 都得到一套独立的水桶：/api/login 与 /api/register
// 各 5 次/分互不挤占，不然注册一次就吃掉一半登录额度。
func RateLimit(anonPerMin, adminPerMin int) echo.MiddlewareFunc {
	anonLimiter := newIPRateLimiter(anonPerMin)
	adminLimiter := newIPRateLimiter(adminPerMin)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			limiter := anonLimiter
			if isAdminToken(c) {
				limiter = adminLimiter
			}

			if !limiter.allow(clientIP(c)) {
				// 桶以每分钟 N 个的速率补满，所以最长等一分钟
				c.Response().Header().Set("Retry-After", "60")
				return c.JSON(http.StatusTooManyRequests, echo.Map{
					"error": "请求过于频繁，请稍后再试",
				})
			}

			return next(c)
		}
	}
}

// clientIP 返回用于限流的客户端标识。
//
// 优先 X-Real-IP —— nginx 用 `proxy_set_header X-Real-IP $remote_addr`
// 覆写该头，取值来自 nginx 自己的对端地址，客户端伪造不了。
//
// 这里**不看 X-Forwarded-For**：nginx 配的是 $proxy_add_x_forwarded_for，
// 会把客户端自带的取值原样拼进去，谁都能靠每请求换一个 XFF 绕过限流。
// （Echo 的 c.RealIP() 虽然也先查 X-Real-IP，但它会退回 XFF，所以不能直接用。）
//
// 代价：若日后有反向代理只设 XFF 不设 X-Real-IP，请求会退化成按
// RemoteAddr 计数，此时所有流量可能共用一个桶 —— 改动 nginx 时请留意。
func clientIP(c echo.Context) string {
	if ip := strings.TrimSpace(c.Request().Header.Get("X-Real-IP")); ip != "" {
		return ip
	}

	host, _, err := net.SplitHostPort(c.Request().RemoteAddr)
	if err != nil {
		return c.Request().RemoteAddr
	}
	return host
}

// isAdminToken 判断请求是否携带有效的管理员 token。
//
// 只用来选限流档位，不在这里拒绝请求 —— 鉴权是 RequireAdmin 的事。
// token 无效、过期或不是管理员，一律按匿名档处理。
func isAdminToken(c echo.Context) bool {
	raw := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
	if raw == "" {
		return false
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret, nil
	})

	return err == nil && token.Valid && claims.IsAdmin
}

const (
	// 桶的清扫间隔与闲置淘汰时间，防止 IP 表无限增长
	rateLimitSweepInterval = 10 * time.Minute
	rateLimitIdleTTL       = 10 * time.Minute
)

type rateBucket struct {
	tokens   float64
	lastSeen time.Time
}

// ipRateLimiter 是「每个键一个令牌桶」的计数器。
// 桶容量等于每分钟配额，因此允许一次性用满，之后按配额匀速补充。
type ipRateLimiter struct {
	mu        sync.Mutex
	buckets   map[string]*rateBucket
	capacity  float64
	perSecond float64
	lastSweep time.Time
}

func newIPRateLimiter(perMinute int) *ipRateLimiter {
	if perMinute <= 0 {
		perMinute = 1
	}
	return &ipRateLimiter{
		buckets:   make(map[string]*rateBucket),
		capacity:  float64(perMinute),
		perSecond: float64(perMinute) / 60,
		lastSweep: time.Now(),
	}
}

func (l *ipRateLimiter) allow(key string) bool {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	if now.Sub(l.lastSweep) >= rateLimitSweepInterval {
		for k, b := range l.buckets {
			if now.Sub(b.lastSeen) >= rateLimitIdleTTL {
				delete(l.buckets, k)
			}
		}
		l.lastSweep = now
	}

	b, ok := l.buckets[key]
	if !ok {
		b = &rateBucket{tokens: l.capacity, lastSeen: now}
		l.buckets[key] = b
	} else {
		b.tokens += now.Sub(b.lastSeen).Seconds() * l.perSecond
		if b.tokens > l.capacity {
			b.tokens = l.capacity
		}
		b.lastSeen = now
	}

	if b.tokens < 1 {
		return false
	}

	b.tokens--
	return true
}
