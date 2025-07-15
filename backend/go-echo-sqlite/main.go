package main

import (
    "seventhcenturyvideogroup/backend/go-echo-sqlite/config"
    "seventhcenturyvideogroup/backend/go-echo-sqlite/routes"

    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

func main() {
    e := echo.New()

    // 中间件配置
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())
    e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{"*"},
        AllowMethods: []string{echo.GET, echo.PUT, echo.POST, echo.DELETE},
    }))

    // 初始化数据库
    config.InitDB()

    // 注册路由
    routes.InitRoutes(e)

    // 启动服务在7777端口
    e.Logger.Fatal(e.Start(":7777"))
}
