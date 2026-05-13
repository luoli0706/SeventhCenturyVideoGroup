package main

import (
	"fmt"
	"os"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/routes"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 加载.env文件（支持多个位置）
	envPaths := []string{
		".env",
		"../.env",
		"../../.env",
	}

	for _, envPath := range envPaths {
		if err := godotenv.Load(envPath); err == nil {
			fmt.Printf("✓ 成功加载.env文件: %s\n", envPath)
			break
		}
	}

	// 打印当前环境信息
	fmt.Printf("当前工作目录: %s\n", os.Getenv("PWD"))
	if wd, err := os.Getwd(); err == nil {
		fmt.Printf("实际工作目录: %s\n", wd)
	}

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

	// 注意：AI助手功能已迁移至 ai-backend 服务（TypeScript + LangGraph）
	fmt.Println("✓ AI助手功能由 ai-backend 服务提供（TypeScript + LangGraph）")

	// 静态文件服务 - 提供头像图片访问
	e.Static("/pics", "pics")

	// 注册路由
	routes.InitRoutes(e)

	// 启动服务在7777端口
	e.Logger.Fatal(e.Start(":7777"))
}
