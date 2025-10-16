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
	"strings"
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

// RefreshDocuments 手动刷新知识库（热更新）
func RefreshDocuments(c echo.Context) error {
	startTime := time.Now()

	err := ragService.RefreshDocuments()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "知识库热更新失败",
			"details": err.Error(),
		})
	}

	status := ragService.GetUpdateStatus()
	status["processing_time"] = time.Since(startTime).Seconds()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "知识库热更新成功",
		"status":  status,
	})
}

// GetKnowledgeBaseStatus 获取知识库状态
func GetKnowledgeBaseStatus(c echo.Context) error {
	status := ragService.GetUpdateStatus()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": status,
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

// SyncMembers 同步成员信息到知识库
func SyncMembers(c echo.Context) error {
	startTime := time.Now()

	err := ragService.SyncMembersToMarkdown()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "同步成员信息失败",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":         "成员信息已同步到知识库",
		"processing_time": time.Since(startTime).Seconds(),
	})
}

// GetRAGStatus 获取RAG系统状态
func GetRAGStatus(c echo.Context) error {
	status := ragService.GetUpdateStatus()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": status,
	})
}

// sendToN8N 发送增强查询到n8n
func sendToN8N(enhancedQuery, originalQuery string, relevantChunks []models.DocumentChunkResult) (string, error) {
	// 构建系统提示词 - 包含人设、语义压缩要求等
	systemPrompt := buildSystemPrompt()

	// 构建上下文字符串，对内容进行语义压缩
	var contextBuilder bytes.Buffer
	contextBuilder.WriteString("【检索到的相关知识库内容】\n\n")

	if len(relevantChunks) > 0 {
		for i, chunk := range relevantChunks {
			// 压缩块内容（最大500字符）
			compressedContent := compressChunkContent(chunk.Content, 500)
			contextBuilder.WriteString(fmt.Sprintf("【参考资料%d - %s (相似度: %.2f)】\n%s\n\n",
				i+1, chunk.Title, chunk.Similarity, compressedContent))
		}
	} else {
		contextBuilder.WriteString("（无直接匹配的知识库内容，基于已知信息进行回答）\n\n")
	}

	// 构建最终的用户查询提示（包含原始查询和上下文）
	userPrompt := fmt.Sprintf("原始用户问题：%s\n\n%s\n\n%s",
		originalQuery,
		contextBuilder.String(),
		"请基于上述知识库内容回答问题。如果知识库内容不足以完整回答，请基于已知信息补充说明。")

	// 构建n8n请求 - 包含系统提示、用户提示和原始信息
	n8nRequest := models.N8NRequest{
		Query:        systemPrompt + "\n\n" + userPrompt, // 合并系统提示和用户提示
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

	// 对返回结果进行语义压缩
	response := string(body)
	compressedResponse := compressOutputContent(response, 1000)

	return compressedResponse, nil
}

// buildSystemPrompt 构建系统提示词，包含人设和压缩要求
func buildSystemPrompt() string {
	prompt := `【系统提示】

## 角色身份与人设
你是柒世纪视频组（MAD/MMD 创作研究社团）的常驻AI小助理，昵称为"视小姬"。

### 基本属性
- **身份**：社团内的专业创作顾问，精通 MAD（MAD Movie/动画音乐视频）与 MMD（MikuMikuDance 3D动画）创作
- **语气**：温暖专业、鼓励式教学，全程使用简体中文，必要时提供术语中英对照
- **目标用户**：社团新成员或希望进阶的创作者
- **目标**：帮助用户快速掌握创作技能，提供实用建议和资源支持

### 回复原则
1. **清晰分层**：使用标题/序号/代码块梳理流程；涉及软件操作时按步骤拆解
2. **术语友好**：首次出现的专业概念需解释含义，必要时补充中英对照
3. **合法合规**：提醒遵守版权政策，避免指导侵权内容
4. **需求确认**：在建议前确认成员目标和方向（MAD 或 MMD），不混淆两线建议
5. **鼓励学习**：鼓励用户记录练习日志，推荐社团培训和外部资源

### 分工约束
- 所有答复需先判断属于 MAD 线或 MMD 线
- 仅使用对应模块的知识库信息
- 不跨线混用建议（MAD相关问题只提供MAD方向建议，反之亦然）

## 输出优化要求
- **语义压缩**：在保持完整信息的前提下，适度压缩冗余表述
  - 移除重复的解释
  - 合并相似的步骤
  - 保留所有关键信息和步骤
  - 目标：控制在原文本的 70-80% 长度
- **关键内容保留**：必须保留以下内容
  - 所有操作步骤
  - 重要警告和注意事项
  - 版权合规性提醒
  - 具体建议和推荐

## 响应格式建议
- 对于问题类：简洁回答 → 具体步骤 → 常见问题 → 延伸建议
- 对于技术类：问题诊断 → 解决方案 → 预防建议
- 对于学习类：学习路径 → 详细步骤 → 资源推荐

现在请根据上述人设和要求回答用户的问题。`

	return prompt
} // compressChunkContent 对文档块内容进行语义压缩
func compressChunkContent(content string, maxLength int) string {
	content = strings.TrimSpace(content)

	if len(content) <= maxLength {
		return content
	}

	// 优先保留关键词所在的句子
	keywords := []string{
		"方法", "步骤", "要点", "注意", "建议", "推荐", "解决", "答案",
		"关键", "重要", "必须", "如何", "什么", "为什么", "怎样",
	}

	sentences := strings.Split(content, "。")
	var importantSentences []string

	for _, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if sentence == "" {
			continue
		}

		sentenceLower := strings.ToLower(sentence)
		hasKeyword := false

		for _, keyword := range keywords {
			if strings.Contains(sentenceLower, keyword) {
				hasKeyword = true
				break
			}
		}

		if hasKeyword {
			importantSentences = append(importantSentences, sentence)
		}
	}

	var compressed string
	if len(importantSentences) > 0 {
		compressed = strings.Join(importantSentences, "。")
	} else if len(sentences) > 0 {
		compressed = sentences[0]
	}

	if len(compressed) > maxLength {
		compressed = compressed[:maxLength] + "..."
	}

	return compressed
}

// compressOutputContent 对最终输出结果进行语义压缩
func compressOutputContent(content string, maxLength int) string {
	content = strings.TrimSpace(content)

	if len(content) <= maxLength {
		return content
	}

	// 提取JSON响应中的关键字段（如果是JSON格式）
	var jsonData map[string]interface{}
	if err := json.Unmarshal([]byte(content), &jsonData); err == nil {
		// 优先提取response、message、result、answer等字段
		for _, key := range []string{"response", "message", "result", "answer", "content", "text"} {
			if val, ok := jsonData[key]; ok {
				if strVal, ok := val.(string); ok {
					return strVal
				}
			}
		}
	}

	// 如果不是JSON或没有找到关键字段，进行文本压缩
	lines := strings.Split(content, "\n")
	var importantLines []string

	importanceKeywords := []string{
		"步骤", "建议", "推荐", "要点", "注意", "重要", "必须", "关键",
		"解决", "答案", "结论", "总结",
	}

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		isImportant := false
		lineLower := strings.ToLower(line)

		for _, keyword := range importanceKeywords {
			if strings.Contains(lineLower, strings.ToLower(keyword)) {
				isImportant = true
				break
			}
		}

		// 保留标题行
		if strings.HasPrefix(line, "#") || strings.HasPrefix(line, "##") {
			isImportant = true
		}

		if isImportant {
			importantLines = append(importantLines, line)
		}
	}

	var compressed string
	if len(importantLines) > 0 {
		compressed = strings.Join(importantLines, "\n")
	} else {
		// 使用前几行
		for i := 0; i < len(lines) && i < 3; i++ {
			if strings.TrimSpace(lines[i]) != "" {
				importantLines = append(importantLines, lines[i])
			}
		}
		compressed = strings.Join(importantLines, "\n")
	}

	if len(compressed) > maxLength {
		truncated := compressed[:maxLength]
		lastDot := strings.LastIndex(truncated, "。")
		if lastDot > maxLength/2 {
			compressed = compressed[:lastDot] + "。"
		} else {
			compressed = truncated + "..."
		}
	}

	return compressed
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
