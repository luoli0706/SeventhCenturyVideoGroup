package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/services"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

var ragService *services.RAGService
var faqService *services.FAQService

func init() {
	ragService = services.NewRAGService()
	faqService = services.NewFAQService()
}

// InitializeRAG 初始化RAG系统，加载文档
func InitializeRAG(c echo.Context) error {
	startTime := time.Now()

	err := ragService.LoadDocuments()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "初始化RAG系统失败",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":         "RAG系统初始化成功",
		"processing_time": time.Since(startTime).Seconds(),
	})
}

// QueryRAG 处理RAG查询请求
func QueryRAG(c echo.Context) error {
	startTime := time.Now()

	var query models.RAGQuery
	if err := c.Bind(&query); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   "请求参数错误",
			"details": err.Error(),
		})
	}

	// 验证请求
	if query.Query == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "查询内容不能为空",
		})
	}

	// 首先检查FAQ精确匹配
	if exactFAQ := faqService.FindExactMatch(query.Query); exactFAQ != nil {
		response := models.RAGResponse{
			Query:          query.Query,
			RelevantChunks: []models.DocumentChunkResult{},
			EnhancedQuery:  fmt.Sprintf("【FAQ精确匹配】\n问题：%s\n答案：%s\n\n这是来自知识库的标准答案，希望对你有帮助！如果还有其他问题，随时可以继续提问喵～", exactFAQ.Question, exactFAQ.Answer),
			ProcessingTime: time.Since(startTime).Seconds(),
		}
		return c.JSON(http.StatusOK, response)
	}

	// 设置默认值
	if query.TopK <= 0 {
		query.TopK = 5
	}

	// 检索相关文档块
	relevantChunks, err := ragService.SearchSimilarChunks(query.Query, query.TopK, query.Category)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "检索相关文档失败",
			"details": err.Error(),
		})
	}

	// 增强查询
	enhancedQuery := ragService.EnhanceQuery(query.Query, relevantChunks)

	// 构建响应
	response := models.RAGResponse{
		Query:          query.Query,
		RelevantChunks: relevantChunks,
		EnhancedQuery:  enhancedQuery,
		ProcessingTime: time.Since(startTime).Seconds(),
	}

	return c.JSON(http.StatusOK, response)
}

// QueryRAGWithN8N 处理RAG查询并发送给n8n
func QueryRAGWithN8N(c echo.Context) error {
	startTime := time.Now()

	var query models.RAGQuery
	if err := c.Bind(&query); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   "请求参数错误",
			"details": err.Error(),
		})
	}

	// 验证请求
	if query.Query == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "查询内容不能为空",
		})
	}

	// 首先检查FAQ精确匹配
	if exactFAQ := faqService.FindExactMatch(query.Query); exactFAQ != nil {
		enhancedQuery := fmt.Sprintf("【FAQ精确匹配】\n问题：%s\n答案：%s\n\n这是来自知识库的标准答案，希望对你有帮助！如果还有其他问题，随时可以继续提问喵～", exactFAQ.Question, exactFAQ.Answer)

		// 发送给n8n
		n8nResponse, err := sendToN8N(enhancedQuery, query.Query, []models.DocumentChunkResult{})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error":   "发送到n8n失败",
				"details": err.Error(),
			})
		}

		response := models.RAGResponse{
			Query:          query.Query,
			RelevantChunks: []models.DocumentChunkResult{},
			EnhancedQuery:  enhancedQuery,
			N8NResponse:    n8nResponse,
			ProcessingTime: time.Since(startTime).Seconds(),
		}
		return c.JSON(http.StatusOK, response)
	}

	// 设置默认值
	if query.TopK <= 0 {
		query.TopK = 5
	}

	// 检索相关文档块
	relevantChunks, err := ragService.SearchSimilarChunks(query.Query, query.TopK, query.Category)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "检索相关文档失败",
			"details": err.Error(),
		})
	}

	// 增强查询
	enhancedQuery := ragService.EnhanceQuery(query.Query, relevantChunks)

	// 发送给n8n
	n8nResponse, err := sendToN8N(enhancedQuery, query.Query, relevantChunks)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "发送到n8n失败",
			"details": err.Error(),
		})
	}

	// 构建响应
	response := models.RAGResponse{
		Query:          query.Query,
		RelevantChunks: relevantChunks,
		EnhancedQuery:  enhancedQuery,
		N8NResponse:    n8nResponse,
		ProcessingTime: time.Since(startTime).Seconds(),
	}

	return c.JSON(http.StatusOK, response)
}

// GetDocuments 获取所有已加载的文档列表
func GetDocuments(c echo.Context) error {
	// 分页参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}

	category := c.QueryParam("category")

	documents, total, err := getDocumentsList(page, limit, category)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "获取文档列表失败",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"documents": documents,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

// GetFAQs 获取所有FAQ列表
func GetFAQs(c echo.Context) error {
	category := c.QueryParam("category")

	allFAQs := faqService.GetAllFAQs()
	var filteredFAQs []services.FAQ

	if category != "" {
		for _, faq := range allFAQs {
			if faq.Category == category {
				filteredFAQs = append(filteredFAQs, faq)
			}
		}
	} else {
		filteredFAQs = allFAQs
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"faqs":  filteredFAQs,
		"total": len(filteredFAQs),
	})
}

// sendToN8N 发送增强查询到n8n
func sendToN8N(enhancedQuery, originalQuery string, relevantChunks []models.DocumentChunkResult) (string, error) {
	// 构建上下文字符串
	var contextBuilder bytes.Buffer
	for i, chunk := range relevantChunks {
		contextBuilder.WriteString(fmt.Sprintf("【参考资料%d - %s】\n%s\n\n", i+1, chunk.Title, chunk.Content))
	}

	// 构建n8n请求
	n8nRequest := models.N8NRequest{
		Query:        enhancedQuery,
		Context:      contextBuilder.String(),
		UserQuestion: originalQuery,
	}

	jsonData, err := json.Marshal(n8nRequest)
	if err != nil {
		return "", err
	}

	// 发送HTTP请求到n8n webhook
	// 注意：这里需要配置实际的n8n webhook URL
	n8nURL := "http://localhost:5678/webhook/ai-assistant" // 示例URL，需要根据实际情况修改

	req, err := http.NewRequest("POST", n8nURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("n8n响应错误: %s", resp.Status)
	}

	return string(body), nil
}

// getDocumentsList 获取文档列表
func getDocumentsList(page, limit int, category string) ([]models.Document, int64, error) {
	db := config.GetDB()
	var documents []models.Document
	var total int64

	query := db.Model(&models.Document{})
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页数据
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("updated_at DESC").Find(&documents).Error; err != nil {
		return nil, 0, err
	}

	return documents, total, nil
}
