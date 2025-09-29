# 配置指南

本文档介绍如何配置 SVCG 社团管理系统的各项设置。

## 环境配置

### 前端环境变量

在 `frontend` 目录创建环境配置文件：

#### 开发环境 (.env.development)
```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:8080/api

# 应用标题
VITE_APP_TITLE=SVCG 开发环境

# 调试模式
VITE_DEBUG=true

# 日志级别
VITE_LOG_LEVEL=debug
```

#### 生产环境 (.env.production)
```env
# API 基础地址
VITE_API_BASE_URL=https://api.svcg.com/api

# 应用标题
VITE_APP_TITLE=SVCG 社团管理系统

# 调试模式
VITE_DEBUG=false

# 日志级别
VITE_LOG_LEVEL=error
```

### 后端配置

#### 数据库配置

在 `backend/go-echo-sqlite/config/config.go` 中配置数据库：

```go
type DatabaseConfig struct {
    Driver   string `json:"driver"`
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Database string `json:"database"`
    Username string `json:"username"`
    Password string `json:"password"`
    SSLMode  string `json:"ssl_mode"`
}

var DbConfig = DatabaseConfig{
    Driver:   "sqlite3",
    Database: "app.db",
    SSLMode:  "disable",
}
```

#### 服务器配置

```go
type ServerConfig struct {
    Port        string `json:"port"`
    Host        string `json:"host"`
    Environment string `json:"environment"`
    Debug       bool   `json:"debug"`
}

var ServerConf = ServerConfig{
    Port:        "8080",
    Host:        "localhost",
    Environment: "development",
    Debug:       true,
}
```

#### JWT 配置

```go
type JWTConfig struct {
    Secret         string        `json:"secret"`
    ExpirationTime time.Duration `json:"expiration_time"`
    Issuer         string        `json:"issuer"`
}

var JWTConf = JWTConfig{
    Secret:         "your-secret-key-here",
    ExpirationTime: time.Hour * 24, // 24小时
    Issuer:         "svcg-system",
}
```

## 应用配置

### 主题配置

支持深浅主题切换，在 `frontend/src/style.css` 中定义：

```css
/* 亮色主题 */
:root {
  --color-primary: #1677ff;
  --color-bg-base: #ffffff;
  --color-text-primary: #000000d9;
}

/* 暗色主题 */
[data-theme='dark'] {
  --color-primary: #4096ff;
  --color-bg-base: #141414;
  --color-text-primary: #ffffffd9;
}
```

### 路由配置

在 `frontend/src/router/index.js` 中配置路由：

```javascript
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/members',
    name: 'Members',
    component: () => import('@/views/Members.vue'),
    meta: { 
      title: '成员管理',
      requiresAuth: true 
    }
  }
]
```

## 数据库配置

### 初始化脚本

系统启动时会自动运行数据库迁移：

```go
func InitDatabase() {
    db.AutoMigrate(
        &models.User{},
        &models.MemberProfile{},
        &models.Activity{},
        &models.ClubMember{},
    )
}
```

### 数据库连接

```go
func ConnectDatabase() {
    dsn := fmt.Sprintf("%s?_foreign_keys=on", DbConfig.Database)
    
    var err error
    db, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    
    if err != nil {
        panic("无法连接到数据库")
    }
}
```

## 日志配置

### 前端日志

在 `frontend/src/utils/logger.js` 中配置：

```javascript
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL] || LOG_LEVELS.info

export const logger = {
  debug: (message, ...args) => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  info: (message, ...args) => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  warn: (message, ...args) => {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },
  error: (message, ...args) => {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }
}
```

### 后端日志

使用 Echo 的日志中间件：

```go
import (
    "github.com/labstack/echo/v4/middleware"
    "github.com/labstack/gommon/log"
)

func setupMiddleware(e *echo.Echo) {
    // 日志中间件
    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
        Format: "${time_rfc3339} ${status} ${method} ${uri} ${latency_human}\n",
    }))
    
    // 设置日志级别
    if ServerConf.Debug {
        e.Logger.SetLevel(log.DEBUG)
    } else {
        e.Logger.SetLevel(log.INFO)
    }
}
```

## 安全配置

### CORS 配置

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"http://localhost:5173", "https://svcg.com"},
    AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
    AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
}))
```

### 请求限制

```go
e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))
```

### 安全头

```go
e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
    XSSProtection:         "1; mode=block",
    ContentTypeNosniff:    "nosniff",
    XFrameOptions:         "DENY",
    HSTSMaxAge:           3600,
    ContentSecurityPolicy: "default-src 'self'",
}))
```

## 文件上传配置

### 前端上传配置

```javascript
// utils/upload.js
export const uploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  uploadUrl: '/api/upload'
}
```

### 后端上传配置

```go
func setupUpload(e *echo.Echo) {
    // 文件上传限制
    e.Use(middleware.BodyLimit("5M"))
    
    // 静态文件服务
    e.Static("/uploads", "uploads")
}
```

## 缓存配置

### Redis 配置 (可选)

```go
type RedisConfig struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Password string `json:"password"`
    DB       int    `json:"db"`
}

var RedisConf = RedisConfig{
    Host:     "localhost",
    Port:     6379,
    Password: "",
    DB:       0,
}
```

## 监控配置

### 健康检查

```go
func healthCheck(c echo.Context) error {
    return c.JSON(http.StatusOK, map[string]interface{}{
        "status":    "ok",
        "timestamp": time.Now().Unix(),
        "version":   "1.0.0",
    })
}
```

### 性能监控

```go
func setupMetrics(e *echo.Echo) {
    // 添加请求计数和延迟监控
    e.Use(middleware.RequestID())
    
    // 自定义监控中间件
    e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            start := time.Now()
            err := next(c)
            duration := time.Since(start)
            
            // 记录请求指标
            log.Printf("Request: %s %s - %v", 
                c.Request().Method, 
                c.Request().URL.Path, 
                duration)
            
            return err
        }
    })
}
```

## 部署配置

### Docker 配置

详见 [Docker 部署指南](../deployment/docker.md)

### 环境变量

生产环境建议使用环境变量：

```bash
# .env.production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=svcg
DB_USER=svcg_user
DB_PASSWORD=secure_password
JWT_SECRET=super_secure_jwt_secret
SERVER_PORT=8080
ENVIRONMENT=production
```

## 故障排除

### 常见配置问题

1. **数据库连接失败**
   - 检查数据库文件权限
   - 确认数据库路径正确

2. **前端API请求失败**
   - 检查 CORS 配置
   - 确认 API 基础地址

3. **JWT 认证失败**
   - 检查密钥配置
   - 确认过期时间设置

### 调试技巧

1. 启用调试模式查看详细日志
2. 使用浏览器开发者工具检查网络请求
3. 检查服务器响应头和状态码

## 下一步

- 📖 阅读 [快速开始指南](./getting-started.md)
- 🛠️ 查看 [开发指南](../development/)
- 🚀 学习 [部署指南](../deployment/)
