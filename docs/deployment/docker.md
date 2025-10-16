# Docker 部署指南

本指南介绍如何使用 Docker 和 Docker Compose 部署柒世纪视频组系统。

## 📋 概览

项目已包含完整的 Docker 配置，支持一键启动所有服务。

## 🚀 快速开始

### 前置要求

- Docker 19.03+
- Docker Compose 1.25+
- 至少 2GB 可用内存
- 至少 20GB 可用磁盘空间

### 检查 Docker 安装

```bash
docker --version
docker-compose --version
```

### 启动服务

```bash
# 进入 ai-agent 目录
cd ai-agent

# 启动 Docker 容器（后台运行）
docker-compose up -d

# 查看容器状态
docker-compose ps
```

预期输出：
```
NAME          COMMAND                  STATE           PORTS
n8n           "/bin/sh -c npm run …"   Up 2 minutes    0.0.0.0:5678->5678/tcp
redis         "redis-server"           Up 2 minutes    6379/tcp
```

## 🔧 服务配置

### docker-compose.yml 结构

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

### 可用服务

| 服务 | 端口 | 说明 |
|------|------|------|
| n8n | 5678 | 工作流引擎 |
| Redis | 6379 | 缓存和队列 |
| 后端 | 7777 | Go API 服务 |
| 前端 | 5173 | Vue 开发服务 |

## 📊 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 持续跟踪 n8n 日志
docker-compose logs -f n8n

# 查看最后 100 行日志
docker-compose logs --tail=100
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart n8n
```

### 停止服务

```bash
# 停止所有服务（保留容器）
docker-compose stop

# 停止所有服务（删除容器）
docker-compose down

# 停止并删除所有数据
docker-compose down -v
```

### 进入容器

```bash
# 进入 n8n 容器
docker-compose exec n8n bash

# 进入 redis 容器
docker-compose exec redis redis-cli
```

## 🔐 环境变量配置

### n8n 配置

创建 `.env` 文件在 `ai-agent` 目录：

```env
# n8n 配置
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_DOMAIN=localhost:5678

# 安全设置
N8N_ENCRYPTION_KEY=your-random-key-here
N8N_USER_MANAGEMENT_DISABLED=false
```

### Redis 配置

Redis 默认配置即可，无需密码。

## 🔄 数据持久化

服务使用 Docker Volumes 实现数据持久化：

```yaml
volumes:
  n8n_data:/home/node/.n8n      # n8n 工作流和配置
  redis_data:/data              # Redis 数据
```

### 查看 Volumes

```bash
docker volume ls
docker volume inspect n8n_data
```

### 备份数据

```bash
# 备份 n8n 数据
docker run --rm -v n8n_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/n8n_backup.tar.gz -C /data .

# 恢复 n8n 数据
docker run --rm -v n8n_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/n8n_backup.tar.gz -C /data
```

## 📈 性能调优

### 内存限制

```yaml
services:
  n8n:
    mem_limit: 1g
    memswap_limit: 1g
  redis:
    mem_limit: 512m
```

### CPU 限制

```yaml
services:
  n8n:
    cpus: '1.0'
    cpuset: '0'
```

## 🐛 故障排除

### 问题1：端口被占用

```bash
# 检查端口占用
netstat -tuln | grep 5678

# 使用其他端口
docker-compose -f docker-compose.yml up -d --build \
  --scale n8n=0 && \
  N8N_PORT=5679 docker-compose up -d n8n
```

### 问题2：内存不足

```bash
# 检查可用内存
docker stats

# 清理未使用的镜像和容器
docker system prune -a
```

### 问题3：容器无法启动

```bash
# 查看详细日志
docker-compose logs n8n

# 检查镜像完整性
docker pull n8nio/n8n:latest
```

## 📝 生产部署建议

### 1. 反向代理

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name n8n.example.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL/TLS

配置 HTTPS：

```yaml
environment:
  - N8N_PROTOCOL=https
  - N8N_DOMAIN=n8n.example.com
```

### 3. 日志收集

配置日志驱动：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 4. 监控告警

使用 Prometheus + Grafana 监控：

```bash
docker run -d --name prometheus \
  -v prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

## 🔗 相关资源

- [生产环境配置](production.md)
- [监控和日志](monitoring.md)
- [系统架构设计](../architecture/system-architecture.md)

---

有任何问题，请查看 Docker Compose 官方文档或提交 Issue。
