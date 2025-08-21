# 安装配置

本文档详细介绍如何安装和配置 SVCG 社团管理系统的开发环境。

## 系统要求

### 硬件要求

- **CPU**: 双核 2.0GHz 或更高
- **内存**: 4GB RAM 或更高（推荐 8GB）
- **存储**: 至少 2GB 可用空间
- **网络**: 稳定的互联网连接

### 操作系统支持

- Windows 10/11
- macOS 10.15 或更高版本
- Ubuntu 18.04 或更高版本
- 其他 Linux 发行版

## 环境安装

### 1. 安装 Node.js

#### Windows 用户

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本的安装包
3. 运行安装程序，按照向导完成安装
4. 验证安装：

```bash
node --version
npm --version
```

#### macOS 用户

使用 Homebrew 安装：

```bash
# 安装 Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 验证安装
node --version
npm --version
```

#### Linux 用户

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Go

#### Windows 用户

1. 访问 [Go 官网](https://golang.org/dl/)
2. 下载 Windows 安装包
3. 运行安装程序
4. 配置环境变量（通常自动完成）
5. 验证安装：

```bash
go version
```

#### macOS 用户

```bash
# 使用 Homebrew
brew install go

# 验证安装
go version
```

#### Linux 用户

```bash
# 下载并安装 Go
wget https://golang.org/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 验证安装
go version
```

### 3. 安装 Git

#### Windows 用户

1. 访问 [Git 官网](https://git-scm.com/)
2. 下载 Windows 版本
3. 运行安装程序，建议使用默认设置

#### macOS 用户

```bash
# 使用 Homebrew
brew install git

# 或者使用 Xcode Command Line Tools
xcode-select --install
```

#### Linux 用户

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

### 4. 安装 VS Code（推荐）

1. 访问 [VS Code 官网](https://code.visualstudio.com/)
2. 下载适合您操作系统的版本
3. 安装并启动 VS Code

#### 推荐插件

安装以下 VS Code 插件以获得更好的开发体验：

- **Vue Language Features (Volar)**: Vue 3 支持
- **Go**: Go 语言支持
- **ESLint**: JavaScript/TypeScript 代码检查
- **Prettier**: 代码格式化
- **GitLens**: Git 增强功能
- **Thunder Client**: API 测试工具

## 项目克隆与初始化

### 1. 克隆项目

```bash
git clone https://github.com/luoli0706/SeventhCenturyVideoGroup.git
cd SeventhCenturyVideoGroup
```

### 2. 后端环境配置

```bash
cd backend/go-echo-sqlite

# 初始化 Go 模块（如果需要）
go mod tidy

# 下载依赖
go mod download
```

### 3. 前端环境配置

```bash
cd frontend

# 安装依赖
npm install

# 或者使用 yarn
yarn install
```

### 4. 环境变量配置

#### 前端环境变量

创建 `.env.local` 文件：

```bash
cd frontend
cp .env .env.local
```

编辑 `.env.local`：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:8080/api

# 应用标题
VITE_APP_TITLE=SVCG 社团管理系统

# 开发模式
NODE_ENV=development
```

#### 后端环境变量

如果需要自定义配置，可以修改 `backend/go-echo-sqlite/config/config.go`：

```go
type Config struct {
    Port     string `json:"port"`
    Database string `json:"database"`
    JWTSecret string `json:"jwt_secret"`
}
```

## 数据库初始化

SVCG 使用 SQLite 数据库，首次运行时会自动创建：

```bash
cd backend/go-echo-sqlite
go run main.go
```

系统将自动：

1. 创建 `app.db` 数据库文件
2. 运行数据库迁移
3. 创建必要的表结构
4. 插入初始数据（如果有）

## 验证安装

### 1. 测试后端

```bash
cd backend/go-echo-sqlite
go run main.go
```

访问 `http://localhost:8080/api/health` 应该返回健康检查信息。

### 2. 测试前端

```bash
cd frontend
npm run dev
```

访问 `http://localhost:5173` 应该看到应用主页。

## 开发工具配置

### VS Code 工作区设置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "go.formatTool": "goimports",
  "vue.server.hybridMode": true,
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Git 配置

配置 Git 用户信息：

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 下一步

配置完成后，您可以：

- 📚 阅读 [开发指南](/development/)
- 🔧 查看 [配置说明](./configuration.md)
- 🚀 开始 [第一个功能开发](./getting-started.md)
