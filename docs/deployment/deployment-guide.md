# 部署指南

## 系统要求

### 硬件要求
- CPU: 2核及以上
- 内存: 4GB+（推荐8GB）
- 存储: 10GB+（用于数据库和知识库）
- 网络: 稳定的互联网连接（用于Deepseek API调用）

### 软件要求
- Go 1.18+ (后端)
- Node.js 16+ (前端)
- Docker & Docker Compose (容器化部署，可选)
- SQLite 3+ (数据库)

## 部署架构

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Frontend (Vue.js)                                  │ │
│  │  - nginx或内置HTTP服务器                            │ │
│  │  - 监听端口3000                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Backend (Go + Echo)                                │ │
│  │  - REST API服务器                                   │ │
│  │  - 监听端口7777                                     │ │
│  │  - SQLite数据库                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  n8n工作流引擎                                       │ │
│  │  - AI处理节点                                       │ │
│  │  - 监听端口5678                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Redis (可选，用于高性能缓存)                        │ │
│  │  - 监听端口6379                                     │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 本地开发部署

### 1. 克隆仓库

```bash
git clone https://github.com/luoli0706/SeventhCenturyVideoGroup.git
cd SeventhCenturyVideoGroup
```

### 2. 后端部署

#### 2.1 配置环境变量

```bash
cd backend/go-echo-sqlite
cp .env.example .env

# 编辑.env文件，填入Deepseek API密钥
vim .env
```

.env文件内容：
```bash
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_EMBEDDING_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com
RAG_EMBEDDING_DIMENSION=1024
RAG_TOP_K=5
```

#### 2.2 安装依赖

```bash
go mod tidy
```

#### 2.3 启动后端服务

```bash
go run main.go
```

成功启动后，会显示：
```
✓ 成功加载.env文件: .env
✓ Deepseek API密钥已配置 (前缀: sk-...)
✓ RAG系统初始化完成
【诊断】文档总数: 2
【诊断】文档块总数: 53

⇨ http server started on [::]:7777
```

### 3. 前端部署

#### 3.1 安装依赖

```bash
cd frontend
npm install
```

#### 3.2 开发模式启动

```bash
npm run dev
```

访问 `http://localhost:5173` (Vite默认端口)

#### 3.3 生产构建

```bash
npm run build
```

## Docker容器化部署

### 1. 准备Docker环境

```bash
# 检查Docker是否已安装
docker --version
docker-compose --version
```

### 2. 配置docker-compose.yml

已优化的docker-compose.yml配置：

```yaml
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: n8n_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    depends_on:
      - redis
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
      - DB_TYPE=sqlite
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - TZ=Asia/Shanghai
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n-local-files:/files

volumes:
  redis_data:
    driver: local
  n8n_data:
    driver: local
```

### 3. 启动容器

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## Kubernetes部署（高级）

### 1. 创建命名空间

```bash
kubectl create namespace scvg
```

### 2. 部署后端

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: scvg
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: scvg-backend:latest
        ports:
        - containerPort: 7777
        env:
        - name: DEEPSEEK_API_KEY
          valueFrom:
            secretKeyRef:
              name: deepseek-secret
              key: api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 3. 创建Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: scvg
spec:
  type: LoadBalancer
  ports:
  - port: 7777
    targetPort: 7777
  selector:
    app: backend
```

## 生产环境配置

### 1. 数据库备份

```bash
# 每天定时备份数据库
0 2 * * * cp /path/to/app.db /path/to/backup/app.db.$(date +%Y%m%d)
```

### 2. 日志管理

配置日志输出到文件：

```bash
# 启动时重定向日志
go run main.go > /var/log/scvg-backend.log 2>&1 &
```

### 3. SSL/TLS配置

使用nginx反向代理配置HTTPS：

```nginx
server {
    listen 443 ssl;
    server_name api.7thcv.cn;

    ssl_certificate /etc/ssl/certs/api.7thcv.cn.crt;
    ssl_certificate_key /etc/ssl/private/api.7thcv.cn.key;

    location / {
        proxy_pass http://localhost:7777;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 性能优化

#### 4.1 启用缓存

```go
// 在main.go中配置缓存中间件
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"*"},
}))
```

#### 4.2 限流配置

```go
e.Use(middleware.RateLimiter(middleware.NewRateLimiterConfig().
    Store: middleware.NewRateLimiterMemoryStore(100)))
```

#### 4.3 数据库连接池

```go
// 在config/database.go中配置
db.DB().SetMaxIdleConns(10)
db.DB().SetMaxOpenConns(100)
```

## 故障恢复

### 1. 数据库损坏恢复

```bash
# 使用备份还原
rm app.db
cp app.db.backup app.db

# 重启服务
systemctl restart scvg-backend
```

### 2. 知识库恢复

```bash
# 使用备份还原
rm -rf backend/AI-data-source/
cp -r backend/AI-data-source.backup/ backend/AI-data-source/

# 触发热更新
curl -X POST http://localhost:7777/api/rag/refresh
```

### 3. 容器异常处理

```bash
# 查看容器状态
docker-compose ps

# 重启容器
docker-compose restart backend

# 查看容器日志
docker-compose logs -f backend
```

## 监控和告警

### 1. 系统监控

```bash
# 使用Prometheus + Grafana
docker run -d -p 9090:9090 prom/prometheus

# 配置后端暴露Prometheus metrics
```

### 2. 健康检查

```bash
# 手动检查服务健康状态
curl http://localhost:7777/api/rag/status
```

### 3. 日志聚合

```bash
# 使用ELK Stack收集日志
docker-compose -f docker-compose.elk.yml up -d
```

## 性能基准

| 指标 | 基准值 | 优化目标 |
|------|-------|---------|
| API响应时间 | 50-100ms | <50ms |
| 数据库查询 | 10-20ms | <10ms |
| 向量计算 | 20-30ms | <20ms |
| 并发连接数 | 100+ | 1000+ |

## 升级指南

### 升级后端

```bash
cd backend/go-echo-sqlite
git pull origin main
go mod tidy
go build -o scvg main.go

# 备份旧版本
mv scvg scvg.bak

# 启动新版本
./scvg
```

### 升级前端

```bash
cd frontend
git pull origin main
npm install
npm run build

# 备份旧版本
mv dist dist.bak

# 部署新版本
npm run serve
```

## 常见问题

### Q: 如何修改服务端口？
A: 编辑`main.go`中的端口号，默认为7777。

### Q: 如何启用HTTPS？
A: 使用nginx或Apache做反向代理，配置SSL证书。

### Q: 支持多节点部署吗？
A: 可以，使用负载均衡器（如Nginx）分发请求。

### Q: 如何扩展存储容量？
A: 知识库存储在SQLite，可迁移到PostgreSQL或MySQL获得更好的可扩展性。

## 总结

按照本指南的步骤，可以快速部署系统到开发、测试和生产环境。建议先在本地开发环境测试，然后逐步部署到生产环境。
