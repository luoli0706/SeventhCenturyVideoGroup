# 柒世纪视频组 — 社团管理系统

柒世纪视频组（Seventh Century Video Group）MAD/MMD 创作研究社团官方网站及管理系统。

---

## 技术栈 | Tech Stack

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite + Arco Design Vue + Vue Router |
| **主后端** | Go + Echo v4 + GORM + SQLite |
| **AI 后端** | TypeScript + ReACT + B+ Tree KB + DeepSeek API |
| **代理** | nginx (HTTPS via Let's Encrypt) |
| **运行** | systemd 服务托管 |

---

## 项目结构 | Project Structure

```
scvg/
├── frontend/                           # Vue 3 SPA
│   ├── src/
│   │   ├── components/                 # 复用组件
│   │   ├── router/                     # 路由配置
│   │   ├── views/                      # 页面视图
│   │   ├── utils/                      # 工具函数（api.js 等）
│   │   ├── App.vue                     # 根组件（含路由过渡动画）
│   │   ├── main.js                     # 入口
│   │   └── style.css                   # 全局 CSS 变量 + 主题
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── go-echo-sqlite/                 # Go 主后端（端口 7777）
│   │   ├── main.go                     # 入口
│   │   ├── config/                     # 数据库配置
│   │   ├── controllers/                # 控制器（auth, member, kb...）
│   │   ├── models/                     # GORM 数据模型
│   │   ├── routes/                     # 路由注册
│   │   ├── middleware/                 # JWT 中间件
│   │   └── services/                   # 服务层（含 KB 同步）
│   │
│   ├── ai-backend/                     # TypeScript AI 后端（端口 7778）
│   │   ├── src/
│   │   │   ├── index.ts                # Express 服务入口
│   │   │   ├── routes/                 # chat + history 路由
│   │   │   ├── services/               # ReACT agent, KB 导航, 聊天历史
│   │   │   ├── config/                 # 环境变量
│   │   │   └── types/                  # TypeScript 类型
│   │   └── package.json
│   │
│   └── AI-data-source/                 # AI 知识库（B+ Tree 目录结构）
│       ├── 索引.md                     # 索引树（H1→H4）
│       ├── 社团概况/                   # 社团信息
│       ├── MAD知识核心/                # MAD 知识
│       ├── MMD知识核心/                # MMD 知识
│       ├── 新人路线图/                 # 学习路径
│       ├── 资源导航/                   # 资源汇总
│       ├── 常见问答FAQ.md
│       └── 柒世纪视频组成员名单/        # 成员信息（含更新历史）
│
├── Readme.md
└── .gitignore
```

---

## 快速开始 | Getting Started

### 先决条件 Prerequisites

- Node.js 18+
- Go 1.18+
- SQLite 3

### 前端启动 | Frontend

```bash
cd frontend
npm install
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### Go 后端启动 | Backend

```bash
cd backend/go-echo-sqlite
go mod tidy
go run main.go
```

服务监听 [http://localhost:7777](http://localhost:7777)

### AI 后端启动 | AI Backend

```bash
cd backend/ai-backend
npm install
# 配置 .env 文件（参照 .env.example）
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY
npx tsx src/index.ts
```

服务监听 [http://localhost:7778](http://localhost:7778)

### 生产构建 | Production Build

```bash
cd frontend
npm run build
# 输出到 frontend/dist/
```

nginx 反向代理配置：

```
/api/*       → localhost:7777  (Go 后端)
/api/ai/*    → localhost:7778  (AI 后端，streaming)
```

---

## 主要功能 | Features

- **社团成员管理** — 名单浏览（按届/现役）、注册、编辑个人主页
- **AI 视小姬** — 基于 ReACT + B+ Tree 知识库的智能问答助手，支持流式输出
- **知识库编辑器** — 在线编辑 AI 知识库 Markdown 文件，支持树形导航、预览
- **聊天历史** — 每个用户独立的 SQLite 持久化聊天记录
- **深浅色主题** — 全局 CSS 变量驱动，一键切换
- **响应式布局** — 移动端适配
- **知识库自动同步** — 成员注册/编辑个人资料后自动更新知识库及索引

---

## API 端点 | API Endpoints

### Go 后端（/api/*）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/club_members | 成员列表 |
| POST | /api/register | 成员注册 |
| POST | /api/login | 登录 |
| GET/POST/PUT | /api/member-profile/:cn | 个人主页 |
| POST | /api/upload-avatar | 上传头像 |
| GET | /api/kb/tree | KB 目录树 |
| POST | /api/kb/save | 保存 KB 文件 |
| POST | /api/kb/create | 创建 KB 文件/目录 |
| DELETE | /api/kb/delete | 删除 KB 文件/目录 |

### AI 后端（/api/ai/*）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ai/chat | AI 对话（流式 SSE） |
| GET | /api/ai/sessions | 会话列表 |
| GET | /api/ai/sessions/:id | 会话消息 |
| DELETE | /api/ai/sessions/:id | 删除会话 |
| GET | /api/ai/health | 健康检查 |

---

## 设计主题 | Design Theme

深色创意风格，灵感来自创作工作室 / 动画作品集美学：

- **主色调**：深靛蓝 (#1a1a2e) → 紫罗兰 (#16213e) → 青色 (#0f9b8e) / 琥珀 (#e6a817)
- **排版**：Plus Jakarta Sans + Noto Sans SC 层级搭配
- **界面**：玻璃态卡片、柔和发光、低透明度边框
- **交互**：青色表示激活/选中，琥珀色表示悬停高亮
- **动效**：200-300ms 平滑过渡，微妙缩放反馈

---

## 配置说明 | Configuration

- Go 后端：`backend/go-echo-sqlite/config/database.go` — 数据库路径及端口
- AI 后端：`backend/ai-backend/.env` — DEEPSEEK_API_KEY, KNOWLEDGE_BASE_PATH
- nginx：`/etc/nginx/conf.d/scvg.conf`
- systemd：`scvg.service` (Go) + `ai-backend.service` (TypeScript)

---

## License

MIT
