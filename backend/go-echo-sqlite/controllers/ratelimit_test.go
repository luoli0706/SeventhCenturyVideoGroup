package controllers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

func TestIPRateLimiterAllowsBurstThenDenies(t *testing.T) {
	l := newIPRateLimiter(5)

	for i := 1; i <= 5; i++ {
		if !l.allow("1.2.3.4") {
			t.Fatalf("配额内的第 %d 次应当放行", i)
		}
	}

	if l.allow("1.2.3.4") {
		t.Fatal("超出配额的请求应当被拒绝")
	}
}

func TestIPRateLimiterKeysAreIndependent(t *testing.T) {
	l := newIPRateLimiter(2)

	l.allow("1.2.3.4")
	l.allow("1.2.3.4")
	if l.allow("1.2.3.4") {
		t.Fatal("1.2.3.4 应当已耗尽配额")
	}

	// 一个 IP 被限流不应该波及另一个 IP
	if !l.allow("5.6.7.8") {
		t.Fatal("另一个 IP 应当有自己的桶")
	}
}

func TestIPRateLimiterRefillsOverTime(t *testing.T) {
	// 100 次/秒，便于用很短的 sleep 观察补充
	l := newIPRateLimiter(6000)

	for i := 0; i < 6000; i++ {
		l.allow("1.2.3.4")
	}
	if l.allow("1.2.3.4") {
		t.Fatal("桶应当已被抽干")
	}

	time.Sleep(50 * time.Millisecond) // 按 100/秒 计，应补回约 5 个

	if !l.allow("1.2.3.4") {
		t.Fatal("等待之后桶应当已补充")
	}
}

// clientIP 的取值规则是一条安全边界：X-Forwarded-For 由客户端自行拼接，
// 按它计数等于没限流。这条测试锁住这个行为，防止日后被「顺手改成 c.RealIP()」。
func TestClientIPIgnoresForwardedFor(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodGet, "/api/login", nil)
	req.RemoteAddr = "10.0.0.1:12345"
	req.Header.Set("X-Forwarded-For", "1.2.3.4") // 客户端伪造
	c := e.NewContext(req, httptest.NewRecorder())

	if got := clientIP(c); got != "10.0.0.1" {
		t.Fatalf("不应采信 X-Forwarded-For，期望 10.0.0.1，得到 %q", got)
	}

	// X-Real-IP 由 nginx 用 $remote_addr 覆写，应当优先采信
	req.Header.Set("X-Real-IP", "9.9.9.9")
	if got := clientIP(c); got != "9.9.9.9" {
		t.Fatalf("应优先采信 X-Real-IP，期望 9.9.9.9，得到 %q", got)
	}
}

func TestClientIPFallsBackToRemoteAddr(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodGet, "/api/login", nil)
	req.RemoteAddr = "192.168.1.7:54321"
	c := e.NewContext(req, httptest.NewRecorder())

	if got := clientIP(c); got != "192.168.1.7" {
		t.Fatalf("无 X-Real-IP 时应退回 RemoteAddr，期望 192.168.1.7，得到 %q", got)
	}
}
