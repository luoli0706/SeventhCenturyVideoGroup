# SeventhCenturyVideoGroup 前端项目

本项目为柒世纪视频组社团管理系统前端，基于 [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [Arco Design Vue](https://arco.design/vue/docs/start) 实现，界面简洁优雅，支持深浅主题切换。

## 功能简介

- 社团成员名单浏览（分届、现役、按年）
- 社团活动、招新等入口
- 成员信息登记表单
- 深浅色主题切换
- 响应式布局，适配主流设备

## 项目结构

```
frontend/
├── public/                # 静态资源（如图片）
├── src/
│   ├── components/        # 复用组件
│   ├── router/            # 路由配置
│   ├── views/             # 页面视图
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── style.css          # 全局样式
├── package.json
├── vite.config.js
└── README.md
```

## 快速开始

### 1. 安装依赖

请确保已安装 [Node.js](https://nodejs.org/) 18+。

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看效果。

### 3. 构建生产环境

```bash
npm run build
```

### 4. 预览生产环境

```bash
npm run preview
```

## 主要依赖

- [Vue 3](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Arco Design Vue](https://arco.design/vue/docs/start)
- [Vite](https://vitejs.dev/)

## 其他说明

- 静态图片请放在 `public/` 目录下。
- 如需对接后端，请参考后端项目文档。

---

如有问题欢迎反馈
