# 监控和日志

本指南介绍如何监控系统性能、收集日志和进行故障排查。

## 📊 监控架构

### 监控栈

```
应用层 (Backend/Frontend)
    ↓
指标收集 (Prometheus)
    ↓
时序数据库 (Prometheus)
    ↓
可视化 (Grafana)
    ↓
告警 (AlertManager)
```

## 🔍 日志收集

### 后端日志配置

在 `main.go` 中配置日志：

```go
import "github.com/sirupsen/logrus"

func init() {
    logrus.SetFormatter(&logrus.JSONFormatter{})
    logrus.SetLevel(logrus.InfoLevel)
    
    file, _ := os.OpenFile("logs/backend.log", 
        os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    logrus.SetOutput(file)
}
```

### 日志级别

| 级别 | 说明 | 示例 |
|------|------|------|
| DEBUG | 调试信息 | SQL 查询详情 |
| INFO | 一般信息 | 服务启动 |
| WARN | 警告信息 | 已弃用的 API |
| ERROR | 错误信息 | 数据库连接失败 |
| FATAL | 致命错误 | 无法启动服务 |

### 日志文件位置

```
logs/
├── backend.log          # 后端应用日志
├── nginx_access.log    # Nginx 访问日志
├── nginx_error.log     # Nginx 错误日志
└── system.log          # 系统日志
```

### 日志轮转配置

```bash
# /etc/logrotate.d/svcg
/var/log/svcg/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload svcg-backend > /dev/null 2>&1 || true
    endscript
}
```

## 📈 性能指标

### 系统指标

| 指标 | 说明 | 正常范围 |
|------|------|---------|
| CPU 使用率 | 处理器使用百分比 | <70% |
| 内存使用率 | 内存占用百分比 | <80% |
| 磁盘使用率 | 磁盘空间占用 | <85% |
| 网络 I/O | 网络流量 | <100Mbps |

### 应用指标

| 指标 | 说明 | 正常范围 |
|------|------|---------|
| 请求延迟 (P50) | 中位数响应时间 | <100ms |
| 请求延迟 (P95) | 95%百分位响应时间 | <500ms |
| 请求延迟 (P99) | 99%百分位响应时间 | <1000ms |
| 错误率 | 失败请求百分比 | <0.1% |
| 吞吐量 | 每秒请求数 | >100 req/s |

### RAG 指标

| 指标 | 说明 | 正常范围 |
|------|------|---------|
| Embedding 延迟 | 向量化所需时间 | <500ms |
| 检索延迟 | 知识库查询时间 | <100ms |
| 知识库大小 | 总块数 | >50 chunks |

## 🛠️ 监控工具

### Prometheus

#### 安装

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xzf prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64
```

#### 配置

`prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'svcg-backend'
    static_configs:
      - targets: ['localhost:7777']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

#### 启动

```bash
./prometheus --config.file=prometheus.yml
# 访问: http://localhost:9090
```

### Grafana

#### 安装

```bash
sudo apt-get install -y addons.zulu.openjdk.z@11-jdk-headless
wget https://dl.grafana.com/oss/release/grafana-9.3.0.linux-amd64.tar.gz
tar xzf grafana-9.3.0.linux-amd64.tar.gz
cd grafana-9.3.0
```

#### 配置数据源

1. 访问 http://localhost:3000
2. 登录（默认：admin/admin）
3. 添加数据源：Prometheus
4. URL: http://localhost:9090

#### 创建仪表板

在 Grafana 中创建面板：

- CPU 使用率
- 内存使用率
- 请求延迟
- 错误率
- RAG 性能

### Node Exporter

导出系统指标：

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xzf node_exporter-1.5.0.linux-amd64.tar.gz
cd node_exporter-1.5.0.linux-amd64
./node_exporter
# 访问: http://localhost:9100/metrics
```

## 🚨 告警配置

### AlertManager 配置

`alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
```

### 告警规则

`alert.yml`:

```yaml
groups:
  - name: svcg
    rules:
      - alert: HighCPUUsage
        expr: node_cpu > 80
        for: 5m
        annotations:
          summary: "CPU 使用率超过 80%"

      - alert: HighMemoryUsage
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.2
        for: 5m
        annotations:
          summary: "内存使用率超过 80%"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "错误率超过 1%"
```

## 📝 日志查询示例

### 查看后端日志

```bash
# 实时查看
tail -f logs/backend.log

# 查看最近 100 行
tail -100 logs/backend.log

# 搜索错误
grep "ERROR" logs/backend.log

# 统计错误数
grep "ERROR" logs/backend.log | wc -l
```

### 使用 grep 分析日志

```bash
# 查看特定请求
grep "POST /api/rag/chat" logs/backend.log

# 查看特定时间范围
grep "2025-10-16" logs/backend.log

# 查看响应时间
grep "duration:" logs/backend.log | awk '{print $NF}'
```

### 使用 jq 解析 JSON 日志

```bash
# 查看所有错误
jq 'select(.level=="error")' logs/backend.log

# 统计请求方法
jq '.method' logs/backend.log | sort | uniq -c

# 查看平均响应时间
jq '.duration' logs/backend.log | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

## 🔧 故障排查指南

### 问题1：高 CPU 使用率

**症状**：CPU 使用率持续 >80%

**诊断**：
```bash
top -b -n 1 | grep svcg-backend
ps aux | grep svcg-backend
```

**解决**：
- 检查是否有无限循环
- 增加并发处理能力
- 优化数据库查询

### 问题2：内存泄漏

**症状**：内存占用持续增长

**诊断**：
```bash
free -h
# 或使用 Grafana 看趋势
```

**解决**：
- 检查日志中是否有"连接泄漏"
- 重启服务
- 检查代码中的资源释放

### 问题3：响应缓慢

**症状**：请求延迟 >1000ms

**诊断**：
```bash
curl -w "@curl-format.txt" http://localhost:7777/api/rag/status
```

**解决**：
- 检查数据库连接
- 检查 Deepseek API 延迟
- 优化查询语句

### 问题4：磁盘空间不足

**症状**：磁盘使用率 >90%

**诊断**：
```bash
df -h
du -sh logs/
du -sh data/
```

**解决**：
- 清理旧日志：`find logs/ -mtime +30 -delete`
- 压缩数据库：进行碎片整理
- 扩展磁盘空间

## 📊 仪表板模板

### 系统监控仪表板

关键面板：
- CPU/内存/磁盘使用率（饼图）
- 系统负载（折线图）
- 网络 I/O（面积图）
- 进程列表（表格）

### 应用性能仪表板

关键面板：
- 请求吞吐量（折线图）
- 响应时间分布（柱状图）
- 错误率趋势（折线图）
- 端点性能对比（表格）

### RAG 性能仪表板

关键面板：
- Embedding 延迟（直方图）
- 检索性能（柱状图）
- 知识库统计（卡片）
- 查询热力图（热力图）

## 🔗 相关资源

- [Docker 部署](docker.md)
- [生产环境配置](production.md)
- [系统架构设计](../architecture/system-architecture.md)

---

有任何监控问题，请参考相关工具文档或联系运维团队。
