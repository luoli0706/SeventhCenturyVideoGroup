package main

import (
	"fmt"
	"log"
	"os"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/routes"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/services"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// debugRAGDatabase 打印RAG数据库诊断信息
func debugRAGDatabase() {
	db := config.GetDB()

	// 统计文档数
	var docCount int64
	db.Model(&struct{}{}).Table("documents").Count(&docCount)
	fmt.Printf("【诊断】文档总数: %d\n", docCount)

	// 统计文档块数
	var chunkCount int64
	db.Model(&struct{}{}).Table("document_chunks").Count(&chunkCount)
	fmt.Printf("【诊断】文档块总数: %d\n", chunkCount)

	if docCount > 0 && chunkCount == 0 {
		fmt.Println("⚠ 警告: 文档已加载但未生成向量块！")
		fmt.Println("  原因可能: Embedding API失败或本地回退机制未正确工作")
		fmt.Println("  建议: 检查.env配置或重新启动服务")
	}
}

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

	// 检查API密钥是否设置
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey != "" {
		fmt.Printf("✓ Deepseek API密钥已配置 (前缀: %s...)\n", apiKey[:10])
	} else {
		fmt.Println("⚠ 警告: DEEPSEEK_API_KEY 环境变量未设置，将使用本地向量回退机制")
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
	fmt.Println("\n========== 正在初始化RAG系统 ==========")
	ragService := services.NewRAGService()

	// 加载知识库文档
	if err := ragService.LoadDocuments(); err != nil {
		log.Printf("✗ 加载知识库文档失败: %v", err)
	} else {
		fmt.Println("✓ RAG系统初始化完成")
	}

	// 打印数据库诊断信息
	debugRAGDatabase()
	fmt.Println("==========================================\n")

	// 静态文件服务 - 提供头像图片访问
	e.Static("/pics", "pics")

	// 注册路由
	routes.InitRoutes(e)

	// 启动服务在7777端口
	e.Logger.Fatal(e.Start(":7777"))
}
