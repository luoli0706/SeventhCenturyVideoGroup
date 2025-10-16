package main

import (
	"fmt"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
)

// 调试函数 - 检查数据库中的RAG数据
func debugRAGData() {
	db := config.GetDB()

	// 统计文档数
	var docCount int64
	db.Model(&models.Document{}).Count(&docCount)
	fmt.Printf("【数据库诊断】文档总数: %d\n", docCount)

	// 统计文档块数
	var chunkCount int64
	db.Model(&models.DocumentChunk{}).Count(&chunkCount)
	fmt.Printf("【数据库诊断】文档块总数: %d\n", chunkCount)

	// 显示所有文档
	var documents []models.Document
	db.Find(&documents)
	for _, doc := range documents {
		fmt.Printf("  - 文档: %s (ID: %d, 类别: %s)\n", doc.Title, doc.ID, doc.Category)

		// 统计每个文档的块数
		var blockCount int64
		db.Model(&models.DocumentChunk{}).Where("document_id = ?", doc.ID).Count(&blockCount)
		fmt.Printf("    └─ 块数: %d\n", blockCount)
	}
}
