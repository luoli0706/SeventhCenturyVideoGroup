# SeventhCenturyVideoGroup 后端服务

本项目为柒世纪视频组社团管理系统后端，基于 [Go](https://golang.org/) 语言，使用 [Echo](https://echo.labstack.com/) 框架和 [GORM](https://gorm.io/) ORM，数据库为 SQLite，接口简洁易用。

## 目录结构

```
backend/
├── go.mod
├── go.sum
└── go-echo-sqlite/
    ├── app.db                # SQLite 数据库文件（首次启动自动生成）
    ├── main.go               # 程序入口
    ├── config/               # 配置与数据库初始化
    ├── controllers/          # 控制器
    ├── models/               # 数据模型
    └── routes/               # 路由注册
```

## 先决条件

- [Go 1.18+](https://golang.org/dl/)（建议 1.20 及以上）
- 推荐使用 [VS Code](https://code.visualstudio.com/) 或其他 Go 友好 IDE

## 安装依赖

首次使用请在 `backend/go-echo-sqlite` 目录下执行：

```sh
cd backend/go-echo-sqlite
go mod tidy
```

## 启动服务

在 `backend/go-echo-sqlite` 目录下运行：

```sh
go run main.go
```

启动成功后，服务监听在 `http://localhost:7777`。

## 接口说明

- 获取社团成员列表：`GET    /api/club_members`
- 新增社团成员：    `POST   /api/club_members`
- 删除社团成员：    `DELETE /api/club_members/:id`

## 配置说明

- 数据库文件名及端口配置见 [`config/config.go`](go-echo-sqlite/config/config.go)
- 默认数据库为 `app.db`，首次启动自动生成并迁移表结构

## 开发建议

- 如需更换数据库或端口，请修改 `config/config.go`
- 推荐配合前端项目一同使用

---

如有问题欢迎反