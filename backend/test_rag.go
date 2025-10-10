package main

import (
	"fmt"
	"log"

	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/services"
)

// 测试RAG系统的基本功能
func main() {
	fmt.Println("开始测试RAG系统...")

	// 初始化数据库
	config.InitDB()

	// 创建RAG服务
	ragService := services.NewRAGService()

	// 加载文档
	fmt.Println("正在加载知识库文档...")
	err := ragService.LoadDocuments()
	if err != nil {
		log.Fatalf("加载文档失败: %v", err)
	}

	// 测试查询
	fmt.Println("测试查询功能...")
	query := "如何制作MAD视频？"

	results, err := ragService.SearchSimilarChunks(query, 3, "")
	if err != nil {
		log.Fatalf("查询失败: %v", err)
	}

	fmt.Printf("查询: %s\n", query)
	fmt.Printf("找到 %d 个相关结果:\n", len(results))

	for i, result := range results {
		fmt.Printf("\n结果 %d (相似度: %.4f):\n", i+1, result.Similarity)
		fmt.Printf("标题: %s\n", result.Title)
		fmt.Printf("类别: %s\n", result.Category)
		fmt.Printf("内容片段: %s...\n", result.Content[:min(200, len(result.Content))])
	}

	// 测试增强查询
	enhancedQuery := ragService.EnhanceQuery(query, results)
	fmt.Printf("\n增强后的查询:\n%s\n", enhancedQuery[:min(500, len(enhancedQuery))])

	fmt.Println("\nRAG系统测试完成！")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
