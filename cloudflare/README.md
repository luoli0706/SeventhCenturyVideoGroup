# Cloudflare Turnstile 验证集成

这个目录包含了Cloudflare Turnstile真人验证的完整集成方案，包括验证服务和前端组件。

## 🔧 功能特性

- ✅ Cloudflare Turnstile 免费真人验证
- ✅ Redis缓存验证状态
- ✅ 速率限制防止暴力破解
- ✅ 开发环境跳过验证
- ✅ 自动验证状态管理
- ✅ 响应式验证界面

## 📁 文件结构

```
cloudflare/
├── docker-compose.yml          # Docker服务编排
├── .env                       # 环境变量配置
├── verify-service/            # 验证服务
│   ├── package.json
│   └── index.js
└── README.md                  # 本文档
```

## 🚀 快速开始

### 1. 获取Cloudflare密钥

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的域名
3. 进入 "安全性" > "Turnstile"
4. 创建新的站点密钥
5. 复制 Site Key 和 Secret Key

### 2. 配置环境变量

编辑 `.env` 文件：

```bash
# 替换为你的实际密钥
TURNSTILE_SITE_KEY=your_actual_site_key_here
TURNSTILE_SECRET_KEY=your_actual_secret_key_here

# 其他配置保持默认
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://7thcv.cn,http://localhost:5173
```

### 3. 启动验证服务

```bash
# 创建网络
docker network create scvg_network

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. 前端集成

前端已自动集成验证功能：

- 访问任何页面前会先显示验证界面
- 验证成功后跳转到目标页面
- 验证状态缓存30分钟
- 开发环境自动跳过验证

## 🔗 API端点

### 验证服务 (端口3001)

- `GET /health` - 健康检查
- `GET /config` - 获取站点配置
- `POST /verify` - 验证Turnstile token
- `POST /check` - 检查验证状态

### 请求示例

```javascript
// 验证token
const response = await fetch('/api/cf-verify/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'turnstile_response_token',
    userIP: 'optional_user_ip'
  })
})

// 检查验证状态
const response = await fetch('/api/cf-verify/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verifyToken: 'verify_session_token'
  })
})
```

## 🔄 部署流程

### 开发环境

```bash
# 启动验证服务
cd cloudflare
docker-compose up -d

# 启动前端 (会自动跳过验证)
cd ../frontend
npm run dev
```

### 生产环境

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入真实的Cloudflare密钥

# 2. 启动验证服务
docker-compose up -d

# 3. 构建前端
cd ../frontend
npm run build

# 4. 部署前端 (参考deploy-frontend目录)
```

## 🛡️ 安全特性

### 速率限制
- 每个IP 5分钟内最多5次验证尝试
- 基于Redis的分布式限制

### 会话管理
- 验证成功后生成UUID令牌
- 令牌存储在Redis中，有效期30分钟
- 支持IP和User-Agent验证

### CORS保护
- 限制允许的来源域名
- 防止跨域攻击

## 📊 监控和日志

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f cf-verify-service
docker-compose logs -f redis-verify
```

### 健康检查
```bash
# 检查验证服务
curl http://localhost:3001/health

# 检查Redis
docker-compose exec redis-verify redis-cli ping
```

## 🔧 自定义配置

### 修改验证超时时间
在 `.env` 文件中修改：
```bash
VERIFY_TIMEOUT=600  # 10分钟
MAX_ATTEMPTS=5      # 最大尝试次数
```

### 修改允许域名
在 `.env` 文件中修改：
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 修改Redis配置
在 `docker-compose.yml` 中修改Redis设置。

## 🐛 故障排除

### 验证失败
1. 检查Cloudflare密钥是否正确
2. 确认域名配置是否匹配
3. 查看验证服务日志

### 服务无法启动
```bash
# 检查端口占用
netstat -tlnp | grep 3001

# 检查Docker网络
docker network ls | grep scvg_network

# 重新创建服务
docker-compose down
docker-compose up -d --force-recreate
```

### 前端无法连接验证服务
1. 确认验证服务正在运行
2. 检查Vite代理配置
3. 确认防火墙设置

## 🔄 更新和维护

### 更新验证服务
```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull

# 重启服务
docker-compose up -d --build
```

### 清理验证数据
```bash
# 清理Redis缓存
docker-compose exec redis-verify redis-cli FLUSHDB

# 重置用户验证状态
# 用户需要重新验证
```

## 📈 性能优化

- Redis配置了内存限制和LRU淘汰策略
- 验证服务使用连接池
- 静态资源启用缓存
- 速率限制减少恶意请求

## 🔒 生产环境建议

1. **使用HTTPS**: 确保所有通信加密
2. **密钥安全**: 妥善保管Cloudflare密钥
3. **监控告警**: 设置服务监控和告警
4. **定期备份**: 备份重要配置文件
5. **日志轮转**: 配置日志轮转避免磁盘空间不足