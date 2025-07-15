# SeventhCenturyVideoGroup Monorepo

柒世纪视频组社团管理系统 —— 前后端分离项目  
SeventhCenturyVideoGroup Club Management System — Fullstack Monorepo

---

## 🚀 项目特性 | Features

- 🎨 **现代前端**：Vue 3 + Vite + Arco Design，支持深浅主题切换
- 🖥️ **后端服务**：Go + Echo + GORM，轻量高效，RESTful API
- 🗄️ **数据库**：内置 SQLite，开箱即用
- 📦 **一体化结构**：前后端分离，便于开发与部署
- 🌐 **接口开放**：CORS 支持，便于前后端联调
- 📋 **代码规范**：推荐 VS Code + Volar 插件，开发体验佳

---

## 📁 项目结构 | Project Structure

```
SeventhCenturyVideoGroup/
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

---

## 🚀 快速开始 | Getting Started

### 先决条件 Prerequisites

- Node.js 18+
- Go 1.18+
- 推荐 VS Code + Volar 插件 (Recommended: VS Code + Volar)

---

### 前端启动 | Frontend Start

```bash
cd frontend
npm install
npm run dev
```
访问 Visit: [http://localhost:5173](http://localhost:5173)

---

### 后端启动 | Backend Start

```bash
cd backend/go-echo-sqlite
go mod tidy
go run main.go
```
服务默认监听 Service runs at: [http://localhost:7777](http://localhost:7777)

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

---

## 🔗 API 说明 | API Endpoints

- `GET    /api/club_members`   获取社团成员列表 Get club members
- `POST   /api/club_members`   新增社团成员 Add club member
- `DELETE /api/club_members/:id` 删除社团成员 Delete club member

---

## ⚙️ 配置说明 | Configuration

- 数据库文件名及端口配置见 See [`backend/go-echo-sqlite/config/config.go`](backend/go-echo-sqlite/config/config.go)
- 默认数据库为 `app.db`，首次启动自动生成  
  Default DB is `app.db`, auto-created on first run

---

## 📝 其他说明 | Additional Notes

- 静态图片请放在 `frontend/public/` 目录下  
  Place static images in `frontend/public/`
- 推荐前后端同时启动进行开发  
  Recommended to run both frontend and backend for development

---

## 🤝 贡献 | Contributing

1. Fork 本仓库 Fork this repo
2. 新建分支 Create your feature branch (`git checkout -b feature/your-feature`)
3. 提交更改 Commit your changes (`git commit -m 'Add some feature'`)
4. 推送分支 Push to the branch (`git push origin feature/your-feature`)
5. 提交 Pull Request Open a Pull Request

---

## 📄 License

MIT License

---

如有问题欢迎反馈！  
Feel free to open
