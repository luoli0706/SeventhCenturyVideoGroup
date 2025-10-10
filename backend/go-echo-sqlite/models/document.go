package models

import (
	"time"
)

// Document 代表知识库中的文档
type Document struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	FilePath  string    `json:"file_path" gorm:"not null"`
	Hash      string    `json:"hash" gorm:"not null;index"`
	Category  string    `json:"category"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
}

// DocumentChunk 代表文档的分块
type DocumentChunk struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	DocumentID uint      `json:"document_id" gorm:"not null;index"`
	Content    string    `json:"content" gorm:"type:text;not null"`
	ChunkIndex int       `json:"chunk_index" gorm:"not null"`
	Embedding  string    `json:"embedding" gorm:"type:text"` // JSON格式存储向量
	CreatedAt  time.Time `json:"created_at"`

	// 关联关系
	Document Document `json:"document" gorm:"foreignKey:DocumentID"`
}

// RAGQuery 代表RAG查询请求
type RAGQuery struct {
	Query    string `json:"query" binding:"required"`
	TopK     int    `json:"top_k,omitempty"`    // 检索前K个最相关的文档块
	Category string `json:"category,omitempty"` // 可选的类别过滤
}

// RAGResponse 代表RAG响应
type RAGResponse struct {
	Query          string                `json:"query"`
	RelevantChunks []DocumentChunkResult `json:"relevant_chunks"`
	EnhancedQuery  string                `json:"enhanced_query"`
	N8NResponse    string                `json:"n8n_response,omitempty"`
	ProcessingTime float64               `json:"processing_time"`
}

// DocumentChunkResult 代表检索到的文档块结果
type DocumentChunkResult struct {
	ChunkID    uint    `json:"chunk_id"`
	DocumentID uint    `json:"document_id"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Similarity float64 `json:"similarity"`
	Category   string  `json:"category"`
}

// N8NRequest 发送给n8n的请求
type N8NRequest struct {
	Query        string `json:"query"`
	Context      string `json:"context"`
	UserQuestion string `json:"user_question"`
}
