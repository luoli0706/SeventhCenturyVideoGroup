package main

import (
	"fmt"
	"log"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/routes"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/services"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 加载.env文件（如果存在）
	if err := godotenv.Load(".env"); err != nil {
		log.Println("警告: 无法加载.env文件，将使用环境变量或默认配置")
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

	// 初始化RAG系统
	fmt.Println("正在初始化RAG系统...")
	ragService := services.NewRAGService()

	// 加载知识库文档
	if err := ragService.LoadDocuments(); err != nil {
		log.Printf("加载知识库文档失败: %v", err)
	} else {
		fmt.Println("RAG系统初始化完成")
	}

	// 静态文件服务 - 提供头像图片访问
	e.Static("/pics", "pics")

	// 注册路由
	routes.InitRoutes(e)

	// 启动服务在7777端口
	e.Logger.Fatal(e.Start(":7777"))
}
