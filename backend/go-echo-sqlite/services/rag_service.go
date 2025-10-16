package services

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"sort"
	"strings"
	"time"
)

// DeepSeek API 相关结构体
type DeepSeekChatRequest struct {
	Model       string                `json:"model"`
	Messages    []DeepSeekChatMessage `json:"messages"`
	Temperature float64               `json:"temperature,omitempty"`
}

type DeepSeekChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DeepSeekChatResponse struct {
	ID      string               `json:"id"`
	Object  string               `json:"object"`
	Created int64                `json:"created"`
	Model   string               `json:"model"`
	Choices []DeepSeekChatChoice `json:"choices"`
}

type DeepSeekChatChoice struct {
	Index        int                 `json:"index"`
	Message      DeepSeekChatMessage `json:"message"`
	FinishReason string              `json:"finish_reason"`
}

// Deepseek Embedding API 相关结构体
type DeepSeekEmbeddingRequest struct {
	Model          string   `json:"model"`
	Input          []string `json:"input"`
	EncodingFormat string   `json:"encoding_format,omitempty"`
}

type DeepSeekEmbeddingResponse struct {
	Object string                  `json:"object"`
	Data   []DeepSeekEmbeddingData `json:"data"`
	Model  string                  `json:"model"`
	Usage  DeepSeekEmbeddingUsage  `json:"usage"`
}

type DeepSeekEmbeddingData struct {
	Object    string    `json:"object"`
	Index     int       `json:"index"`
	Embedding []float64 `json:"embedding"`
}

type DeepSeekEmbeddingUsage struct {
	PromptTokens int `json:"prompt_tokens"`
	TotalTokens  int `json:"total_tokens"`
}

type RAGService struct {
	apiKey     string
	httpClient *http.Client
	apiBase    string
	model      string
}

func NewRAGService() *RAGService {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		fmt.Println("警告: DEEPSEEK_API_KEY 环境变量未设置")
	}

	apiBase := os.Getenv("DEEPSEEK_API_BASE")
	if apiBase == "" {
		apiBase = "https://api.deepseek.com"
	}

	model := os.Getenv("DEEPSEEK_EMBEDDING_MODEL")
	if model == "" {
		model = "deepseek-chat"
	}

	return &RAGService{
		apiKey:     apiKey,
		apiBase:    apiBase,
		model:      model,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// LoadDocuments 从AI-data-source目录加载所有markdown文件
func (r *RAGService) LoadDocuments() error {
	// 获取当前工作目录
	wd, err := os.Getwd()
	if err != nil {
		return err
	}

	// 构建AI-data-source路径，支持从不同目录运行
	var dataSourcePath string
	if strings.Contains(wd, "go-echo-sqlite") {
		// 如果在go-echo-sqlite目录下运行
		dataSourcePath = filepath.Join("..", "AI-data-source")
	} else {
		// 如果在backend目录下运行
		dataSourcePath = filepath.Join("AI-data-source")
	}

	// 转换为绝对路径
	dataSourcePath, err = filepath.Abs(dataSourcePath)
	if err != nil {
		return err
	}

	fmt.Printf("AI数据源路径: %s\n", dataSourcePath)

	return filepath.Walk(dataSourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if filepath.Ext(path) == ".md" {
			return r.processMarkdownFile(path)
		}

		return nil
	})
}

// processMarkdownFile 处理单个markdown文件
func (r *RAGService) processMarkdownFile(filePath string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	// 计算文件哈希
	hash := r.calculateHash(string(content))

	// 检查文件是否已存在且未修改
	var existingDoc models.Document
	db := config.GetDB()
	if err := db.Where("file_path = ? AND hash = ?", filePath, hash).First(&existingDoc).Error; err == nil {
		// 文件未修改，跳过处理
		return nil
	}

	// 提取标题
	title := r.extractTitle(string(content))
	if title == "" {
		title = filepath.Base(filePath)
	}

	// 提取类别
	category := r.extractCategory(string(content))

	// 创建或更新文档记录
	doc := models.Document{
		Title:     title,
		Content:   string(content),
		FilePath:  filePath,
		Hash:      hash,
		Category:  category,
		UpdatedAt: time.Now(),
	}

	// 删除旧的文档和分块（如果存在）
	// 首先删除相关的文档块
	db.Where("document_id IN (SELECT id FROM documents WHERE file_path = ?)", filePath).Delete(&models.DocumentChunk{})
	// 然后删除文档
	db.Where("file_path = ?", filePath).Delete(&models.Document{})

	// 保存新文档
	if err := db.Create(&doc).Error; err != nil {
		return err
	}

	// 分割文档并创建分块
	chunks := r.splitDocument(string(content))
	for i, chunk := range chunks {
		embedding, err := r.generateEmbedding(chunk)
		if err != nil {
			fmt.Printf("生成向量失败: %v\n", err)
			continue
		}

		embeddingJSON, _ := json.Marshal(embedding)

		docChunk := models.DocumentChunk{
			DocumentID: doc.ID,
			Content:    chunk,
			ChunkIndex: i,
			Embedding:  string(embeddingJSON),
			CreatedAt:  time.Now(),
		}

		if err := db.Create(&docChunk).Error; err != nil {
			fmt.Printf("保存文档块失败: %v\n", err)
		}
	}

	fmt.Printf("已处理文档: %s (分块数: %d)\n", title, len(chunks))
	return nil
}

// calculateHash 计算文件内容的MD5哈希
func (r *RAGService) calculateHash(content string) string {
	hash := md5.Sum([]byte(content))
	return hex.EncodeToString(hash[:])
}

// extractTitle 从markdown内容中提取标题
func (r *RAGService) extractTitle(content string) string {
	lines := strings.Split(content, "\n")

	// 首先查找front matter中的title
	if len(lines) > 0 && strings.TrimSpace(lines[0]) == "---" {
		for i := 1; i < len(lines); i++ {
			line := strings.TrimSpace(lines[i])
			if line == "---" {
				break
			}
			if strings.HasPrefix(line, "title:") {
				title := strings.TrimSpace(strings.TrimPrefix(line, "title:"))
				return strings.Trim(title, "\"'")
			}
		}
	}

	// 查找第一个H1标题
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "# ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "#"))
		}
	}

	return ""
}

// extractCategory 从markdown内容中提取类别
func (r *RAGService) extractCategory(content string) string {
	lines := strings.Split(content, "\n")

	// 查找front matter中的club字段作为类别
	if len(lines) > 0 && strings.TrimSpace(lines[0]) == "---" {
		for i := 1; i < len(lines); i++ {
			line := strings.TrimSpace(lines[i])
			if line == "---" {
				break
			}
			if strings.HasPrefix(line, "club:") {
				category := strings.TrimSpace(strings.TrimPrefix(line, "club:"))
				return strings.Trim(category, "\"'")
			}
		}
	}

	// 根据内容判断类别
	contentLower := strings.ToLower(content)
	if strings.Contains(contentLower, "mad") && strings.Contains(contentLower, "mmd") {
		return "视频组知识库"
	} else if strings.Contains(contentLower, "mad") {
		return "MAD创作"
	} else if strings.Contains(contentLower, "mmd") {
		return "MMD创作"
	}

	return "通用"
}

// splitDocument 将文档分割成块
func (r *RAGService) splitDocument(content string) []string {
	var chunks []string

	// 按标题分割
	sections := r.splitByHeaders(content)

	for _, section := range sections {
		// 如果段落不超过1500字符，直接使用
		if len(section) <= 1500 {
			if strings.TrimSpace(section) != "" {
				chunks = append(chunks, strings.TrimSpace(section))
			}
		} else {
			// 如果段落太长，尝试按子标题进一步分割
			subSections := r.splitBySubHeaders(section)
			for _, subSection := range subSections {
				if len(subSection) <= 1500 {
					if strings.TrimSpace(subSection) != "" {
						chunks = append(chunks, strings.TrimSpace(subSection))
					}
				} else {
					// 如果仍然太长，按长度分割但保留更多上下文
					subChunks := r.splitByLength(subSection, 1200)
					chunks = append(chunks, subChunks...)
				}
			}
		}
	}

	return chunks
} // splitByHeaders 按标题分割文档
func (r *RAGService) splitByHeaders(content string) []string {
	lines := strings.Split(content, "\n")
	var sections []string
	var currentSection strings.Builder

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		// 检测标题行（以#开头）
		if strings.HasPrefix(trimmedLine, "#") && currentSection.Len() > 0 {
			// 保存当前段落
			if currentSection.Len() > 50 { // 只保存有足够内容的段落
				sections = append(sections, currentSection.String())
			}
			currentSection.Reset()
		}

		currentSection.WriteString(line + "\n")
	}

	// 添加最后一个段落
	if currentSection.Len() > 50 {
		sections = append(sections, currentSection.String())
	}

	return sections
}

// splitBySubHeaders 按子标题进一步分割内容
func (r *RAGService) splitBySubHeaders(content string) []string {
	lines := strings.Split(content, "\n")
	var sections []string
	var currentSection strings.Builder
	var headerLevel = 0

	for i, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		// 检测第一个标题的级别
		if i == 0 && strings.HasPrefix(trimmedLine, "#") {
			headerLevel = len(strings.Split(trimmedLine, "#")[0]) + 1
		}

		// 检测子标题（比当前级别低的标题）
		if strings.HasPrefix(trimmedLine, "#") && headerLevel > 0 {
			currentLevel := len(strings.Split(trimmedLine, "#")[0]) + 1
			if currentLevel > headerLevel && currentSection.Len() > 0 {
				// 保存当前段落
				if currentSection.Len() > 50 {
					sections = append(sections, currentSection.String())
				}
				currentSection.Reset()
			}
		}

		currentSection.WriteString(line + "\n")
	}

	// 添加最后一个段落
	if currentSection.Len() > 50 {
		sections = append(sections, currentSection.String())
	}

	// 如果没有找到子标题，返回原内容
	if len(sections) == 0 {
		sections = append(sections, content)
	}

	return sections
}

// splitByLength 按长度分割文本
func (r *RAGService) splitByLength(text string, maxLength int) []string {
	var chunks []string
	sentences := strings.Split(text, "。")

	var currentChunk strings.Builder

	for _, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if sentence == "" {
			continue
		}

		if currentChunk.Len()+len(sentence) > maxLength && currentChunk.Len() > 0 {
			chunks = append(chunks, currentChunk.String())
			currentChunk.Reset()
		}

		if currentChunk.Len() > 0 {
			currentChunk.WriteString("。")
		}
		currentChunk.WriteString(sentence)
	}

	if currentChunk.Len() > 0 {
		chunks = append(chunks, currentChunk.String())
	}

	return chunks
}

// generateEmbedding 调用Deepseek API生成文本向量
func (r *RAGService) generateEmbedding(text string) ([]float64, error) {
	// 压缩输入文本
	compressedText := r.compressSemanticContent(text, 100)

	// 构建请求
	request := DeepSeekEmbeddingRequest{
		Model:          "deepseek-chat",
		Input:          []string{compressedText},
		EncodingFormat: "float",
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("构建请求失败: %v", err)
	}

	// 发送请求到Deepseek API
	url := fmt.Sprintf("%s/v1/embeddings", r.apiBase)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.apiKey))

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API请求失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API返回错误状态码 %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var response DeepSeekEmbeddingResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("解析响应失败: %v", err)
	}

	if len(response.Data) == 0 {
		return nil, fmt.Errorf("响应中没有嵌入数据")
	}

	return response.Data[0].Embedding, nil
}

// SearchSimilarChunks 搜索相似的文档块
func (r *RAGService) SearchSimilarChunks(query string, topK int, category string) ([]models.DocumentChunkResult, error) {
	// 生成查询向量
	queryEmbedding, err := r.generateEmbedding(query)
	if err != nil {
		return nil, err
	}

	// 从数据库获取所有文档块
	db := config.GetDB()
	var chunks []models.DocumentChunk

	query_db := db.Preload("Document")
	if category != "" {
		query_db = query_db.Joins("JOIN documents ON document_chunks.document_id = documents.id").
			Where("documents.category = ?", category)
	}

	if err := query_db.Find(&chunks).Error; err != nil {
		return nil, err
	}

	// 计算相似度
	var results []models.DocumentChunkResult

	for _, chunk := range chunks {
		var chunkEmbedding []float64
		if err := json.Unmarshal([]byte(chunk.Embedding), &chunkEmbedding); err != nil {
			continue
		}

		similarity := r.cosineSimilarity(queryEmbedding, chunkEmbedding)

		results = append(results, models.DocumentChunkResult{
			ChunkID:    chunk.ID,
			DocumentID: chunk.DocumentID,
			Title:      chunk.Document.Title,
			Content:    chunk.Content,
			Similarity: similarity,
			Category:   chunk.Document.Category,
		})
	}

	// 按相似度排序
	sort.Slice(results, func(i, j int) bool {
		return results[i].Similarity > results[j].Similarity
	})

	// 返回前topK个结果
	if topK > len(results) {
		topK = len(results)
	}

	return results[:topK], nil
}

// cosineSimilarity 计算余弦相似度
func (r *RAGService) cosineSimilarity(a, b []float64) float64 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float64

	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}

// compressSemanticContent 对文本进行语义压缩，保留关键信息
func (r *RAGService) compressSemanticContent(text string, maxLength int) string {
	text = strings.TrimSpace(text)

	if len(text) <= maxLength {
		return text
	}

	// 关键词列表（按重要性排序）
	keywords := []string{
		"mad", "mmd", "视频", "剪辑", "制作", "教程", "软件", "特效",
		"模型", "动画", "音乐", "素材", "创作", "学习", "技术", "工具",
		"社团", "成员", "活动", "比赛", "项目", "培训", "问题", "解决",
		"方法", "步骤", "指南", "推荐", "建议", "必要", "重要", "关键",
	}

	// 提取句子
	sentences := strings.Split(text, "。")
	var importantSentences []string

	for _, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if sentence == "" {
			continue
		}

		// 检查是否包含关键词
		sentenceLower := strings.ToLower(sentence)
		hasKeyword := false
		for _, keyword := range keywords {
			if strings.Contains(sentenceLower, keyword) {
				hasKeyword = true
				break
			}
		}

		// 优先保留包含关键词的句子
		if hasKeyword {
			importantSentences = append(importantSentences, sentence)
		}
	}

	// 如果关键句子足够，使用关键句子
	var compressed string
	if len(importantSentences) > 0 {
		compressed = strings.Join(importantSentences, "。")
	} else {
		// 否则使用第一句或前几个单词
		if len(sentences) > 0 {
			compressed = sentences[0]
		}
	}

	// 如果压缩后的文本仍然过长，进一步截断
	if len(compressed) > maxLength {
		compressed = compressed[:maxLength] + "..."
	}

	return compressed
}

// compressOutput 对输出结果进行语义压缩，保留关键内容
func (r *RAGService) compressOutput(output string, maxLength int) string {
	output = strings.TrimSpace(output)

	if len(output) <= maxLength {
		return output
	}

	// 优先保留以下内容：
	// 1. 标题和关键信息
	// 2. 推荐和建议
	// 3. 步骤说明

	lines := strings.Split(output, "\n")
	var importantLines []string

	importanceKeywords := []string{
		"步骤", "建议", "推荐", "要点", "注意", "重要", "必须", "关键",
		"解决", "方法", "解答", "答案", "结论", "总结", "【", "---",
	}

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 检查是否是重要行
		isImportant := false
		lineLower := strings.ToLower(line)

		for _, keyword := range importanceKeywords {
			if strings.Contains(lineLower, strings.ToLower(keyword)) {
				isImportant = true
				break
			}
		}

		// 保留标题行（以# 或 ## 开头的行）
		if strings.HasPrefix(line, "#") {
			isImportant = true
		}

		if isImportant {
			importantLines = append(importantLines, line)
		}
	}

	// 组合重要行
	var compressed string
	if len(importantLines) > 0 {
		compressed = strings.Join(importantLines, "\n")
	} else {
		// 如果没有重要行，使用前几行
		for i := 0; i < len(lines) && i < 5; i++ {
			if strings.TrimSpace(lines[i]) != "" {
				importantLines = append(importantLines, lines[i])
			}
		}
		compressed = strings.Join(importantLines, "\n")
	}

	// 最终截断到最大长度
	if len(compressed) > maxLength {
		// 尝试在句号处截断
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

// EnhanceQuery 使用检索到的上下文增强查询
func (r *RAGService) EnhanceQuery(originalQuery string, relevantChunks []models.DocumentChunkResult) string {
	if len(relevantChunks) == 0 {
		return originalQuery
	}

	var contextBuilder strings.Builder
	contextBuilder.WriteString("根据以下相关知识回答问题：\n\n")

	for i, chunk := range relevantChunks {
		contextBuilder.WriteString(fmt.Sprintf("【相关资料%d - %s】\n", i+1, chunk.Title))
		contextBuilder.WriteString(chunk.Content)
		contextBuilder.WriteString("\n\n")
	}

	contextBuilder.WriteString("用户问题：" + originalQuery + "\n\n")
	contextBuilder.WriteString("请基于上述相关资料，以视频组AI小助理的身份回答用户问题。回答要：\n")
	contextBuilder.WriteString("1. 专业且温暖，使用简体中文\n")
	contextBuilder.WriteString("2. 结合相关资料给出具体建议\n")
	contextBuilder.WriteString("3. 如果是MAD或MMD相关问题，要明确区分并使用对应模块信息\n")
	contextBuilder.WriteString("4. 提供实用的步骤或建议\n")
	contextBuilder.WriteString("5. 鼓励用户继续学习和创作\n")

	return contextBuilder.String()
}
