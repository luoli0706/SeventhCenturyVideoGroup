# 柒世纪视频组 — 社团管理系统

柒世纪视频组（Seventh Century Video Group）MAD/MMD 创作研究社团官方网站及管理系统。

---

## 技术栈 | Tech Stack

| 层级 | 技术 |
|------|------|
| **前端（SPA）** | Vue 3 + Vite + Arco Design Vue + Vue Router |
| **前端（SSR 首页）** | Nuxt 3 + Nitro |
| **主后端** | Go + Echo v4 + GORM + SQLite（端口 7777） |
| **AI 后端** | TypeScript + ReACT + B+ Tree KB + DeepSeek API（端口 7778） |
| **代理** | nginx（HTTPS via Let's Encrypt） |
| **运行** | systemd 服务托管 |

---

## 项目结构 | Project Structure

```
scvg/
├── frontend/                           # Vue 3 SPA（CSR 页面）
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
├── Hybrid_scvg/                        # Nuxt 3 SSR 首页
│   ├── pages/
│   │   └── index.vue                   # 社团首页（SSR 渲染）
│   ├── assets/
│   │   └── main.css                    # 全局样式
│   ├── nuxt.config.ts                  # Nuxt 配置
│   ├── package.json
│   └── .output/                        # 构建产物（node .output/server/index.mjs）
│
├── backend/
│   ├── go-echo-sqlite/                 # Go 主后端（端口 7777）
│   │   ├── main.go                     # 入口
│   │   ├── config/                     # 数据库配置
│   │   ├── controllers/                # 控制器（auth, member, kb, upload…）
│   │   ├── models/                     # GORM 数据模型
│   │   ├── routes/                     # 路由注册
│   │   ├── middleware/                 # JWT 中间件
│   │   └── services/                   # 服务层
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

## 混合架构 | Hybrid SSR Architecture

网站的首页（`/`）使用 **Nuxt 3 服务端渲染**，其余页面（`/home`、`/members`、`/events` 等）保持 **Vue 3 SPA 客户端渲染**。

```
请求 / → nginx → localhost:3000（Nuxt SSR）→ 返回完整 HTML（含 SEO 元数据）
请求 /verify → nginx → localhost:3000（Nuxt SSR）→ 人机验证页面
请求 /home → nginx → /index.html（SPA 入口）→ Vue Router 客户端路由
请求 /api/* → nginx → localhost:7777（Go 后端 API）
请求 /api/ai/* → nginx → localhost:7778（AI 后端，流式）
```

### 人机验证流程 | CAPTCHA Flow

用户从 SSR 首页（`/`）点击"进入站点"后，跳转至 `/verify` 页面完成阿里云验证码 2.0 V3（弹窗模式），验证通过后重定向至 `/login-choice`（SPA 页面），选择成员登录或访客浏览。验证结果由 Nuxt SSR 服务端通过阿里云 `VerifyIntelligentCaptcha` API 验签，并提供每日 1000 次调用熔断保护。

```
首页 / → 点击进入站点 → /verify（阿里云验证码）→ 通过 → /login-choice（成员登录 / 访客浏览）
```

nginx 路由规则：
- `location = /` → 代理到 Nuxt SSR（端口 3000）
- `location /verify` → 代理到 Nuxt SSR（端口 3000）
- `location /` → 返回 SPA 的 `index.html`
- `location /api/turnstile-verify` → 代理到 Nuxt SSR（端口 3000），阿里云验证码验签
- `location /api/` → 代理到 Go 后端（端口 7777）
- `location /api/ai/` → 代理到 AI 后端（端口 7778，streaming）
- `location ^~ /_nuxt/` → Nuxt 静态资源
- `location ^~ /pics/` → 头像 / 活动图片静态文件

---

## 快速开始 | Getting Started

### 先决条件 Prerequisites

- Node.js 18+
- Go 1.18+
- SQLite 3

### 前端（SPA）启动

```bash
cd frontend
npm install
npm run dev
```

开发模式访问 [http://localhost:5173](http://localhost:5173)

### SSR 首页启动

```bash
cd Hybrid_scvg
npm install
npm run dev
```

SSR 开发模式访问 [http://localhost:3000](http://localhost:3000)

### Go 后端启动

```bash
cd backend/go-echo-sqlite
go mod tidy
go run main.go
```

服务监听 [http://localhost:7777](http://localhost:7777)

### AI 后端启动

```bash
cd backend/ai-backend
npm install
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY
npx tsx src/index.ts
```

服务监听 [http://localhost:7778](http://localhost:7778)

### 生产构建 | Production Build

```bash
# SPA 前端
cd frontend
npm run build
# 输出到 frontend/dist/

# SSR 首页
cd Hybrid_scvg
npm run build
# 输出到 Hybrid_scvg/.output/
```

---

## 主要功能 | Features

- **社团首页** — SSR 渲染的社团对外展示页，含成员数据、活动动态
- **社团成员管理** — 名单浏览（按届/现役）、注册、编辑个人主页
- **AI 视小姬** — 基于 ReACT + B+ Tree 知识库的智能问答助手，支持流式输出
- **知识库编辑器** — 在线编辑 AI 知识库 Markdown 文件，支持树形导航、预览
- **社团活动** — 活动发布、多图片上传、时间线展示
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
| GET/POST | /api/activities | 活动列表 / 创建 |
| POST | /api/upload/image | 活动图片上传（支持多张） |
| POST | /api/upload/delete | 删除已上传的图片 |
| GET | /api/kb/tree | KB 目录树 |
| POST | /api/kb/save | 保存 KB 文件 |
| POST | /api/kb/create | 创建 KB 文件/目录 |
| DELETE | /api/kb/delete | 删除 KB 文件/目录 |

### Nuxt SSR（/api/*）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/turnstile-verify | 阿里云验证码 2.0 服务端验签 |

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
- Nuxt SSR：`Hybrid_scvg/.env` — 阿里云验证码配置（NUXT_ALIYUN_CAPTCHA_ACCESS_KEY_ID, NUXT_ALIYUN_CAPTCHA_ACCESS_KEY_SECRET, NUXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID, NUXT_PUBLIC_ALIYUN_CAPTCHA_PREFIX）
- nginx：`/etc/nginx/conf.d/scvg.conf`
- systemd 服务：
  - `scvg.service` — Go 后端
  - `ai-backend.service` — TypeScript AI 后端
  - `hybrid-scvg-ssr.service` — Nuxt 3 SSR 首页（含验证码验签 API）

---

## License

MIT
