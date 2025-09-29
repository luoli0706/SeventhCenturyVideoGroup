# 快速开始

本指南将帮助您快速搭建和运行 SVCG 社团管理系统的开发环境。

## 环境要求

在开始之前，请确保您的开发环境满足以下要求：

### 必需软件

- **Node.js**: 版本 16.0 或更高
- **Go**: 版本 1.19 或更高
- **Git**: 用于版本控制
- **VS Code**: 推荐的开发编辑器

### 推荐软件

- **Postman** 或 **Apifox**: API 测试工具
- **SQLite Browser**: 数据库可视化工具

## 克隆项目

```bash
git clone https://github.com/luoli0706/SeventhCenturyVideoGroup.git
cd SeventhCenturyVideoGroup
```

## 后端启动

1. 进入后端目录：
```bash
cd backend/go-echo-sqlite
```

2. 下载依赖：
```bash
go mod download
```

3. 启动服务：
```bash
go run main.go
```

后端服务将在 `http://localhost:8080` 启动。

## 前端启动

1. 打开新的终端，进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端应用将在 `http://localhost:5173` 启动。

## 验证安装

### 测试后端 API

打开浏览器或使用 curl 测试：

```bash
curl http://localhost:8080/api/health
```

预期返回：
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 测试前端应用

1. 打开浏览器访问 `http://localhost:5173`
2. 您应该看到 SVCG 系统的主页
3. 尝试点击不同的导航菜单

## 常见问题

### 端口占用

如果遇到端口占用问题：

**前端端口冲突**：
```bash
# 指定其他端口启动
npm run dev -- --port 3000
```

**后端端口冲突**：
修改 `backend/go-echo-sqlite/config/config.go` 中的端口配置。

### 依赖安装失败

**Node.js 依赖**：
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Go 依赖**：
```bash
# 清理模块缓存
go clean -modcache
go mod download
```

### 数据库问题

如果数据库文件损坏或需要重置：

```bash
cd backend/go-echo-sqlite
rm app.db
go run main.go  # 重新创建数据库
```

## 下一步

- 📖 阅读 [配置指南](./configuration.md)
- 🛠️ 查看 [开发指南](/development/)
- 📋 了解 [API 文档](/api/)

## 获取帮助

如果遇到问题，您可以：

- 查看 [常见问题解答](./faq.md)
- 在 GitHub 上 [提交 Issue](https://github.com/luoli0706/SeventhCenturyVideoGroup/issues)
- 联系开发团队
