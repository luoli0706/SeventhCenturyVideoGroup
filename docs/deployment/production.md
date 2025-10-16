# 生产环境配置

本指南介绍生产环境中的配置和优化建议。

## 📋 环境对比

| 项目 | 开发环境 | 生产环境 |
|------|---------|---------|
| **日志级别** | DEBUG | INFO/WARN |
| **并发连接** | 10+ | 100+ |
| **缓存** | 禁用 | 启用 |
| **数据库** | SQLite | SQLite/PostgreSQL |
| **API超时** | 30s | 10s |
| **错误响应** | 详细 | 简洁 |

## 🔧 后端配置

### 环境变量

创建 `.env` 文件在 `backend/go-echo-sqlite` 目录：

```bash
# 服务配置
SERVER_HOST=0.0.0.0
SERVER_PORT=7777
SERVER_ENV=production

# 数据库配置
DB_PATH=/data/app.db
DB_MAX_CONNECTIONS=100

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# RAG 配置
DEEPSEEK_API_KEY=your-api-key-here
RAG_EMBEDDING_DIMENSION=1024
RAG_TOP_K=5
RAG_CACHE_ENABLED=true
RAG_CACHE_TTL=3600

# 认证配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=86400

# CORS 配置
CORS_ORIGINS=https://example.com
CORS_CREDENTIALS=true
```

### 启动配置

```bash
#!/bin/bash
# 生产启动脚本 start.sh

cd /app/backend/go-echo-sqlite
export $(cat .env | xargs)

# 启用 graceful shutdown
/app/backend/go-echo-sqlite/server

# 监听 SIGTERM 信号
trap 'kill -TERM $PID' TERM
wait $PID
```

## 🚀 前端配置

### 构建优化

```bash
cd frontend
npm run build
```

### Vite 生产配置

`vite.config.js`:

```javascript
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue'],
          'arco': ['@arco-design/web-vue']
        }
      }
    }
  }
}
```

### 部署目录结构

```
/var/www/svcg/
├── frontend/
│   └── dist/           # 构建后的前端文件
├── backend/            # 后端应用
├── data/
│   └── app.db         # 数据库文件
└── logs/
    ├── backend.log
    └── nginx.log
```

## 🏢 服务器配置

### Nginx 反向代理

`/etc/nginx/sites-available/svcg.conf`:

```nginx
upstream backend {
    server localhost:7777;
    keepalive 32;
}

upstream n8n {
    server localhost:5678;
}

server {
    listen 80;
    server_name svcg.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name svcg.example.com;

    ssl_certificate /etc/letsencrypt/live/svcg.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/svcg.example.com/privkey.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 静态文件
    location / {
        root /var/www/svcg/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # 后端 API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # n8n 工作流
    location /n8n/ {
        proxy_pass http://n8n/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 日志
    access_log /var/log/nginx/svcg_access.log combined;
    error_log /var/log/nginx/svcg_error.log warn;
}
```

### Systemd 服务配置

`/etc/systemd/system/svcg-backend.service`:

```ini
[Unit]
Description=SVCG Backend Service
After=network.target

[Service]
Type=simple
User=svcg
WorkingDirectory=/app/backend/go-echo-sqlite
ExecStart=/app/backend/go-echo-sqlite/server
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable svcg-backend
sudo systemctl start svcg-backend
sudo systemctl status svcg-backend
```

## 🔒 安全加固

### 1. 防火墙配置

```bash
# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制 SSH
sudo ufw allow from 10.0.0.0/8 to any port 22
```

### 2. 数据库备份

```bash
#!/bin/bash
# daily_backup.sh

BACKUP_DIR="/backups/svcg"
DB_FILE="/app/data/app.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/app_$DATE.db"

# 保留最近 30 天备份
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

### 3. 日志审计

```bash
# 配置日志轮转
cat > /etc/logrotate.d/svcg << EOF
/var/log/svcg/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF
```

## 📊 性能优化

### 1. 数据库优化

```go
// 连接池配置
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(100)
sqlDB.SetMaxIdleConns(20)
sqlDB.SetConnMaxLifetime(5 * time.Minute)
```

### 2. 缓存策略

- Redis 缓存热数据
- 浏览器缓存静态文件
- CDN 加速资源分发

### 3. 并发控制

```go
// 限流配置
limiter := rate.NewLimiter(100, 200)
if !limiter.Allow() {
    return "429 Too Many Requests"
}
```

## 🎯 监控告警

### 关键指标

| 指标 | 告警阈值 | 检查周期 |
|------|---------|---------|
| CPU 使用率 | >80% | 1分钟 |
| 内存使用率 | >85% | 1分钟 |
| 磁盘使用率 | >90% | 5分钟 |
| API 响应时间 | >1000ms | 1分钟 |
| 错误率 | >1% | 5分钟 |

### Prometheus 配置

`prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'svcg-backend'
    static_configs:
      - targets: ['localhost:7777/metrics']
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

## 📝 检查清单

部署前确认以下事项：

- [ ] 所有必需的环境变量已配置
- [ ] SSL/TLS 证书已安装
- [ ] 数据库备份策略已设置
- [ ] 监控和告警已启用
- [ ] 日志收集已配置
- [ ] 性能基准测试已完成
- [ ] 安全审计已进行
- [ ] 灾难恢复计划已制定

## 🔗 相关资源

- [Docker 部署](docker.md)
- [监控和日志](monitoring.md)
- [系统架构设计](../architecture/system-architecture.md)

---

有任何问题，请参考相关文档或联系运维团队。
