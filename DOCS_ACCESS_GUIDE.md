# 📖 如何访问和使用 docs 文档

## 概述

`docs` 文件夹是一个 **VuePress 文档站点**，包含系统架构、API参考、部署指南等完整的技术文档。VuePress 是一个基于 Vue.js 的静态网站生成器，专门用于创建文档网站。

---

## 🚀 最快的访问方式

### 第1步：安装依赖（仅第一次需要）

打开 PowerShell，进入 `docs` 目录并安装依赖：

```powershell
cd docs
npm install
```

**预期输出：**
```
added 412 packages, and audited 414 packages in 2m
found 0 vulnerabilities
```

### 第2步：启动开发服务器

```powershell
npm run docs:dev
```

**预期输出：**
```
  vuepress v2.0.0-rc.18
  starting dev server...
  ✔ build successfully in 12.34s
  ➜ Local:   http://localhost:8080/
  ➜ press f to toggle fullscreen
  ➜ press q to quit
```

### 第3步：在浏览器中打开文档

**访问地址：** `http://localhost:8080/`

或者在PowerShell中按住 `Ctrl` 并点击链接。

---

## 📁 docs 文件夹结构

```
docs/
├── package.json                # NPM 配置文件（包含运行脚本）
├── RAG-DOCUMENTATION.md        # 📌 文档导航中心（从这里开始）
├── README.md                   # VuePress 首页
├── .vuepress/
│   ├── config.js              # VuePress 配置文件
│   ├── dist/                  # 构建后的静态网站（npm run docs:build 生成）
│   └── cache/                 # 缓存文件
├── rag-system/                 # RAG 系统文档
│   ├── overview.md            # RAG系统完整介绍
│   └── hot-update-guide.md    # 热更新和成员同步指南
├── api-reference/              # API 参考文档
│   └── rag-api.md             # 完整的API端点文档
├── architecture/               # 系统架构文档
│   └── system-architecture.md # 系统设计和架构详解
├── deployment/                 # 部署文档
│   └── deployment-guide.md    # 多种部署方式指南
└── guide/                      # 快速入门指南
    ├── getting-started.md
    ├── installation.md
    ├── configuration.md
    └── README.md
```

---

## 3️⃣ 三种访问方式

### 方式A：开发模式（**推荐阅读和编辑**）

**优点：** 热重载、实时更新、便于编辑

```powershell
cd docs
npm install          # 第一次需要
npm run docs:dev     # 启动开发服务器
```

浏览器访问：`http://localhost:8080/`

**特性：**
- ✅ 修改 `.md` 文件后浏览器自动刷新
- ✅ 支持实时热加载
- ✅ 便于本地开发和调试

**停止服务：** 在 PowerShell 按 `Ctrl+C`

---

### 方式B：构建静态站点（**用于生产部署**）

**优点：** 生成优化的静态文件，适合部署到服务器

```powershell
cd docs
npm install              # 第一次需要
npm run docs:build      # 构建静态站点
```

**输出示例：**
```
✔ build successfully in 45.67s
✔ generated 28 pages in `.vuepress/dist`
```

**生成的文件：**
- 位置：`docs/.vuepress/dist/`
- 内容：完整的静态HTML网站
- 用途：可部署到任何Web服务器（Nginx、Apache等）

---

### 方式C：预览构建后的站点（**验证生产效果**）

**优点：** 查看生产部署后的效果

```powershell
cd docs
npm run docs:build     # 先构建
npm run docs:serve     # 启动预览服务
```

浏览器访问：`http://localhost:8080/`

**特性：**
- ✅ 查看生产环境中的文档效果
- ✅ 验证构建是否成功
- ✅ 性能类似生产环境

---

## 📚 文档内容导航

### 🎯 我想...

| 需求 | 对应文档 | 打开方式 |
|------|--------|--------|
| **了解系统如何部署** | `deployment/deployment-guide.md` | 开发模式下打开http://localhost:8080/deployment/ |
| **理解RAG系统架构** | `rag-system/overview.md` | 开发模式下打开http://localhost:8080/rag-system/ |
| **查看所有API端点** | `api-reference/rag-api.md` | 开发模式下打开http://localhost:8080/api-reference/ |
| **学习热更新操作** | `rag-system/hot-update-guide.md` | 开发模式下打开http://localhost:8080/rag-system/hot-update-guide.html |
| **深入理解系统设计** | `architecture/system-architecture.md` | 开发模式下打开http://localhost:8080/architecture/ |
| **快速入门** | `guide/getting-started.md` | 开发模式下打开http://localhost:8080/guide/ |
| **查看文档导航** | `RAG-DOCUMENTATION.md` | 开发模式下点击首页导航链接 |

---

## 🔧 系统要求

### Node.js 和 npm

VuePress 需要 Node.js 环境。

**检查已安装版本：**
```powershell
node --version
npm --version
```

**要求版本：**
- Node.js: 14.0 或更高
- npm: 6.0 或更高

### 安装 Node.js

如果还未安装，访问：https://nodejs.org/

选择 **LTS（长期支持）** 版本下载安装。

---

## 💻 PowerShell 命令详解

### 进入 docs 目录
```powershell
cd docs
```

### 安装依赖包
```powershell
npm install
```
- 首次运行需要
- 会创建 `node_modules` 文件夹
- 耗时2-5分钟

### 启动开发服务器
```powershell
npm run docs:dev
```
- 启动本地开发服务器
- 会自动打开浏览器（某些情况下）
- 按 `Ctrl+C` 停止

### 构建静态站点
```powershell
npm run docs:build
```
- 生成优化的静态文件
- 输出到 `.vuepress/dist/`
- 用于生产部署

### 预览构建的站点
```powershell
npm run docs:serve
```
- 启动预览服务器
- 展示构建后的效果
- 需要先运行 `npm run docs:build`

### 查看 npm 脚本
```powershell
npm run
```
- 列出所有可用的脚本命令

---

## 🎯 典型使用流程

### 场景1：我想阅读和编辑文档

```powershell
# 1. 进入docs目录
cd docs

# 2. 第一次使用：安装依赖
npm install

# 3. 启动开发服务器
npm run docs:dev

# 4. 浏览器会自动打开或手动访问
http://localhost:8080/

# 5. 编辑 .md 文件，浏览器自动刷新
# 按 Ctrl+C 停止服务
```

### 场景2：我想将文档部署到生产环境

```powershell
# 1. 进入docs目录
cd docs

# 2. 安装依赖
npm install

# 3. 构建静态站点
npm run docs:build

# 4. 生成的文件在 .vuepress/dist/
# 4.1 可以上传到 GitHub Pages
# 4.2 可以部署到 Nginx 服务器
# 4.3 可以部署到任何静态Web服务
```

### 场景3：我想验证构建效果

```powershell
# 1. 进入docs目录
cd docs

# 2. 构建静态站点
npm run docs:build

# 3. 启动预览服务
npm run docs:serve

# 4. 访问并检查效果
http://localhost:8080/
```

---

## 🐛 常见问题

### Q1: `npm install` 失败？

**原因：** 网络问题或npm缓存损坏

**解决方案：**
```powershell
# 清除npm缓存
npm cache clean --force

# 重新安装
npm install
```

### Q2: 访问 http://localhost:8080/ 时显示空白或404？

**原因：** 开发服务器未启动或构建失败

**解决方案：**
```powershell
# 确保运行了以下命令
npm run docs:dev

# 查看PowerShell中的错误信息
# 如果有红色错误提示，可能是文件格式问题
```

### Q3: 端口 8080 被占用？

**原因：** 其他应用已占用该端口

**解决方案：**
```powershell
# VuePress会自动尝试下一个可用端口
# 或指定其他端口
npm run docs:dev -- --port 9000
```

### Q4: 修改文件后浏览器不自动更新？

**原因：** 缓存问题

**解决方案：**
```powershell
# 手动刷新浏览器：Ctrl+F5（强制刷新）
# 或清除 .vuepress/cache
rm -r .vuepress/cache

# 重启开发服务器
npm run docs:dev
```

### Q5: 构建很慢？

**原因：** 缓存堆积或网络问题

**解决方案：**
```powershell
# 清除缓存
rm -r .vuepress/cache
rm -r node_modules

# 重新安装和构建
npm install
npm run docs:build
```

---

## 📦 VuePress 相关信息

### 文档生成工具

本项目使用 VuePress 2.0 作为文档生成工具。

**特点：**
- ✅ Markdown 支持
- ✅ 自动导航生成
- ✅ 响应式设计
- ✅ 暗黑模式支持
- ✅ 快速搜索功能

### package.json 中的配置

```json
{
  "name": "svcg-docs",
  "version": "1.0.0",
  "description": "SeventhCenturyVideoGroup 开发者文档",
  "scripts": {
    "docs:dev": "vuepress dev .",
    "docs:build": "vuepress build .",
    "docs:serve": "vuepress serve ."
  },
  "devDependencies": {
    "@vuepress/bundler-vite": "^2.0.0-rc.18",
    "@vuepress/theme-default": "^2.0.0-rc.18",
    "sass-embedded": "^1.90.0",
    "vuepress": "^2.0.0-rc.18"
  }
}
```

---

## 🌐 生产部署选项

### 选项1：部署到 GitHub Pages

```powershell
# 构建站点
npm run docs:build

# 将 .vuepress/dist 推送到 GitHub Pages
# 具体步骤参考 deployment-guide.md
```

### 选项2：部署到 Nginx

```bash
# 构建站点
npm run docs:build

# 复制到Nginx服务器
sudo cp -r .vuepress/dist/* /var/www/html/docs/

# 或使用 scp 远程复制
scp -r .vuepress/dist/* user@server:/var/www/html/docs/
```

### 选项3：部署到 Docker

详见 `deployment/deployment-guide.md` 中的Docker部分。

---

## ✅ 快速检查清单

访问文档前，请确认：

- [ ] 已安装 Node.js 14+ 和 npm 6+
- [ ] 已进入 `docs` 目录
- [ ] 已运行 `npm install`
- [ ] 已运行 `npm run docs:dev` 或 `npm run docs:build`
- [ ] 知道访问地址：`http://localhost:8080/`

---

## 📞 下一步

1. **现在就试试：** 运行 `npm run docs:dev` 启动服务器
2. **打开浏览器：** 访问 `http://localhost:8080/`
3. **浏览文档：** 开始阅读 RAG 系统文档
4. **编辑内容：** 修改 `.md` 文件，看到实时更新

---

## 📝 文件清单

| 文件 | 功能 |
|------|------|
| `package.json` | VuePress 配置和依赖声明 |
| `.vuepress/config.js` | VuePress 构建配置 |
| `RAG-DOCUMENTATION.md` | 文档导航中心（重要！） |
| `README.md` | VuePress 首页 |
| `rag-system/overview.md` | RAG系统完整介绍 |
| `rag-system/hot-update-guide.md` | 热更新指南 |
| `api-reference/rag-api.md` | API参考 |
| `architecture/system-architecture.md` | 系统架构 |
| `deployment/deployment-guide.md` | 部署指南 |
| `guide/*` | 快速入门指南 |

---

**创建日期：** 2025年10月16日  
**文档版本：** 1.0.0  
**状态：** ✅ 完成
