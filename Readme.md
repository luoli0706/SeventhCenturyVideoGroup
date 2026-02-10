# SeventhCenturyVideoGroup Monorepo

柒世纪视频组社团管理系统 —— 前后端分离项目  
SeventhCenturyVideoGroup Club Management System — Fullstack Monorepo

---

## 🚀 项目特性 | Features

- 🎨 **现代前端**：Vue 3 + Vite + Arco Design，支持深浅主题切换
- 🖥️ **后端服务**：Go + Echo + GORM，轻量高效，RESTful API
- 🤖 **AI 助手服务**：Python + FastAPI + LangChain，支持 Ask/Proxy 两种模式
- 🗄️ **数据库**：内置 SQLite，开箱即用
- 📦 **一体化结构**：前后端分离，便于开发与部署
- 🌐 **接口开放**：CORS 支持，便于前后端联调
- 📋 **代码规范**：推荐 VS Code + Volar 插件，开发体验佳

---

## 📁 项目结构 | Project Structure

```
SeventhCenturyVideoGroup/
├── ai-backend/                     # AI 服务 (Python + FastAPI + LangChain)
│   ├── main.py                     # 程序入口 (默认 6201)
│   ├── requirements.txt            # Python 依赖
│   ├── app/                        # FastAPI routes/schemas
│   └── chain/                      # LangChain 链路（Ask/Proxy + 记忆）
├── ai-agent/                       # 本地测试脚本/工具（端到端测试等）
├── backend/                        # 后端服务 Backend (Go + Echo + SQLite)
│   ├── go.mod
│   ├── go.sum
│   ├── README.md
│   └── go-echo-sqlite/
│       ├── main.go                 # 程序入口 Entry
│       ├── app.db                  # SQLite 数据库文件 Database file
│       ├── config/                 # 配置与数据库初始化 Config & DB init
│       ├── controllers/            # 控制器 Controllers
│       ├── models/                 # 数据模型 Models
│       └── routes/                 # 路由 Routes
├── frontend/                       # 前端应用 Frontend (Vue 3 + Vite + Arco Design)
│   ├── public/                     # 静态资源 Static assets
│   ├── src/
│   │   ├── components/             # 复用组件 Components
│   │   ├── router/                 # 路由配置 Router
│   │   ├── views/                  # 页面视图 Views
│   │   ├── App.vue                 # 根组件 App root
│   │   ├── main.js                 # 入口文件 Entry
│   │   └── style.css               # 全局样式 Global style
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
```

---

## 🛠️ 技术栈 | Tech Stack

### 前端 | Frontend

- 框架 Framework: Vue 3
- UI 组件库 UI: Arco Design Vue
- 构建工具 Build: Vite
- 路由 Routing: Vue Router

### 后端 | Backend

- 语言 Language: Go 1.18+
- 框架 Framework: Echo v4
- ORM: GORM
- 数据库 Database: SQLite

### AI 服务 | AI Service

- 语言 Language: Python
- 框架 Framework: FastAPI
- LLM 编排 Orchestration: LangChain
- 记忆 Memory: LangChain SQLChatMessageHistory + SQLite（可配置临时/长期）

---

## 🚀 快速开始 | Getting Started

### 先决条件 Prerequisites

- Node.js 18+
- Go 1.18+
- Python3.14+（建议使用项目内虚拟环境）

---

### 前端启动 | Frontend Start

```bash
cd frontend
npm install
npm run dev
```
访问 Visit: [http://localhost:5173](http://localhost:5173)

开发模式代理（Vite dev proxy）：

- `/api/*` → `http://localhost:7777`
- `/api/rag/*` → `http://localhost:6201`

---

### 后端启动 | Backend Start

```bash
cd backend/go-echo-sqlite
go mod tidy
go run main.go
```
服务默认监听 Service runs at: [http://localhost:7777](http://localhost:7777)

---

### AI 服务启动 | AI Backend Start

AI 服务默认监听：`http://localhost:6201`

1) 安装依赖（建议使用虚拟环境，例如 `.venv-1`）

```bash
cd ai-backend
python -m venv ..\.venv-1
..\.venv-1\Scripts\python.exe -m pip install -r requirements.txt
```

2) 配置环境变量（最少需要 Key；Base/Model 可选）

```bash
setx DEEPSEEK_API_KEY "<your_key>"
setx DEEPSEEK_API_BASE "https://api.deepseek.com"
setx DEEPSEEK_MODEL "deepseek-chat"
```

3) 启动

```bash
cd ai-backend
..\.venv-1\Scripts\python.exe main.py
```

---

## 📚 主要功能 | Main Features

- 社团成员名单浏览（分届、现役、按年）  
  Browse club members by year, current, or active years
- 社团活动、招新等入口  
  Club events and recruitment entries
- 成员信息登记表单  
  Member registration form
- 深浅色主题切换  
  Light/Dark theme switch
- 响应式布局  
  Responsive layout

- AI 助手（Ask / Proxy）
  - Ask：只回答问题（走 `/api/rag/chat/stream`）
  - Proxy：可在授权下执行成员注册/查询/更新/删除（走 `/api/rag/mcp/stream`）
  - 记忆模式：
    - 临时：按 `cn:sessionId` 记忆（一次对话内有效）
    - 长期：按 `cn` 记忆（跨会话共享，后端最多保留 7 轮）

---

## 🔗 API 说明 | API Endpoints

### 公共/基础接口

- `POST /api/register` 注册
- `POST /api/login` 登录（返回 Bearer token）
- `GET  /api/club_members` 获取社团成员列表（公开字段）

### MCP（需要成员权限 + Bearer token）

- `POST   /api/mcp/register` 注册成员（普通用户仅自己；管理员白名单可为任意 cn）
- `GET    /api/mcp/club_members/:cn` 查询成员（无 cn 限制）
- `PUT    /api/mcp/club_members/:cn` 更新成员（默认仅自己；管理员可强制）
- `DELETE /api/mcp/club_members/:cn` 删除成员（默认仅自己；管理员可强制）

### RAG / AI

- `POST /api/rag/query` 仅检索
- `POST /api/rag/chat/stream` Ask 模式流式对话（JSONL: begin/item/end）
- `POST /api/rag/mcp/stream` Proxy 模式流式对话（同上；会调用 Go MCP 接口）

---

## ⚙️ 配置说明 | Configuration

- 数据库文件名及端口配置见 See [`backend/go-echo-sqlite/config/config.go`](backend/go-echo-sqlite/config/config.go)
- 默认数据库为 `app.db`，首次启动自动生成  
  Default DB is `app.db`, auto-created on first run

- MCP 管理员白名单（Go + Python 同步）：`MCP_ADMIN_CNS`（逗号分隔 cn 列表）
- AI 记忆数据库：默认 `ai-backend/data/chat_memory.sqlite`，可用 `CHAT_MEMORY_DB_PATH` 覆盖

---

## 📝 其他说明 | Additional Notes

- 静态图片请放在 `frontend/public/` 目录下  
  Place static images in `frontend/public/`
- 推荐前后端同时启动进行开发  
  Recommended to run both frontend and backend for development

- 记忆模式说明
  - 前端可选择“临时/长期”；长期模式后端会自动裁剪为最多 7 轮，避免上下文无限增长
  - 权限判断不依赖记忆内容，仍以 Bearer token + 后端规则为准（防止篡改）

---

## 🤝 贡献 | Contributing

1. Fork 本仓库 Fork this repo
2. 新建分支 Create your feature branch (`git checkout -b feature/your-feature`)
3. 提交更改 Commit your changes (`git commit -m 'Add some feature'`)
4. 推送分支 Push to the branch (`git push origin feature/your-feature`)
5. 提交 Pull Request Open a Pull Request

---

## 📄 License

Apache 2.0 License

---

如有问题欢迎反馈！  
Feel free to open
