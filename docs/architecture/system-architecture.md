# 系统架构设计

## 系统概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Vue.js)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - AI助手界面 (AIAssistant.vue)                           │  │
│  │ - 消息展示与输入                                        │  │
│  │ - RAG参考资料展示                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼──────────────────────────────────────┐
│                     API网关 (nginx/直连)                         │
└───────────────────────────┬──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  RAG服务层      │ │  业务服务层  │ │  n8n工作流引擎  │
│ ┌─────────────┐ │ ┌────────────┐ │ ┌───────────────┐ │
│ │RAGService   │ │ │Auth Service│ │ │AI处理节点     │ │
│ │- Query处理  │ │ │User Service│ │ │- 提示词注入   │ │
│ │- Embedding  │ │ │Member Srv  │ │ │- 文本处理     │ │
│ │- 相似度计算 │ │ └────────────┘ │ │- 输出格式化   │ │
│ │- 热更新     │ │                │ │- 反馈收集     │ │
│ └─────────────┘ │                │ └───────────────┘ │
└─────────────────┴──────────────────┴─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐
│ 数据存储层       │ │  缓存层          │ │ 外部服务     │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌────────────┐ │
│ │SQLite        │ │ │Redis         │ │ │Deepseek    │ │
│ │- documents   │ │ │- Query缓存   │ │ │Embedding   │ │
│ │- chunks      │ │ │- 会话缓存    │ │ │API         │ │
│ │- embeddings  │ │ │- 用户缓存    │ │ └────────────┘ │
│ │- users       │ │ └──────────────┘ │                │
│ │- members     │ │                  │                │
│ └──────────────┘ │                  │                │
└──────────────────┴──────────────────┴──────────────────┘
```

## 核心模块详解

### 1. RAG处理层架构

```
用户查询
   │
   ▼
┌────────────────────────────────────┐
│ 查询处理 (QueryHandler)             │
│ - 文本预处理                       │
│ - 参数验证                        │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ FAQ检查 (FAQMatcher)               │
│ - 精确匹配                         │
│ - 相似匹配                        │
└────────────────────────────────────┘
   │
   ├─ 如果匹配 ─→ 返回FAQ答案
   │
   └─ 如果不匹配 ↓
   │
   ▼
┌────────────────────────────────────┐
│ 向量化 (EmbeddingGenerator)         │
│ - 输入语义压缩                     │
│ - Embedding生成                   │
│ - API回退处理                     │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ 相似度搜索 (SimilaritySearcher)      │
│ - 加载向量块                       │
│ - 余弦相似度计算                   │
│ - Top-K排序                       │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ 上下文构建 (ContextBuilder)         │
│ - 组织相关文档                     │
│ - 添加元数据                      │
│ - 格式化输出                      │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ 提示词生成 (PromptGenerator)        │
│ - 系统提示词                       │
│ - 人设约束                        │
│ - 压缩要求                       │
│ - 用户查询                       │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ n8n转发 (N8NForwarder)             │
│ - 构建请求                        │
│ - 异常处理                       │
│ - 响应解析                       │
└────────────────────────────────────┘
```

### 2. 数据存储架构

#### SQLite数据库schema

```sql
-- 文档表
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  hash TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 文档块表
CREATE TABLE document_chunks (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER,
  embedding TEXT,  -- JSON格式的向量
  created_at TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 社团成员表
CREATE TABLE club_members (
  id INTEGER PRIMARY KEY,
  cn TEXT UNIQUE NOT NULL,
  role VARCHAR(50),
  email TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. 向量存储架构

```
┌─────────────────────────────────────┐
│  向量块 (DocumentChunk)              │
├─────────────────────────────────────┤
│ ID: 1                               │
│ Document ID: 1                      │
│ Content: "先用打点工具标记..."        │
│ Embedding: [0.234, 0.456, ...]      │
│ (1024维向量)                        │
│ Index: 0                            │
│ Created: 2025-10-16                 │
└─────────────────────────────────────┘
        │
        ▼ (存储到SQLite)
┌─────────────────────────────────────┐
│  JSON序列化                          │
│  "[0.234, 0.456, ..., 0.789]"       │
└─────────────────────────────────────┘
        │
        ▼ (检索时)
┌─────────────────────────────────────┐
│  反序列化到内存                      │
│  []float64{0.234, 0.456, ...}       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  余弦相似度计算                      │
│  similarity = (A·B) / (|A|×|B|)     │
└─────────────────────────────────────┘
```

### 4. 热更新机制

```
┌──────────────────┐
│ 监听文件系统      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ 检测文件变化 (MD5哈希比对)    │
└────────┬──────────────────────┘
         │
    ┌─────┴──────┐
    │            │
   哈希一致     哈希不一致
    │            │
    ▼            ▼
  跳过       ┌─────────────────┐
         │ 重新处理文件      │
         │ 1. 读取内容      │
         │ 2. 分块          │
         │ 3. 生成向量      │
         │ 4. 存储到DB      │
         └────────┬──────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ 更新用户会话     │
         │ 确保立即使用新知识│
         └──────────────────┘
```

## 交互流程图

### 查询处理流程

```
用户发送消息 (Frontend)
    │
    ▼
POST /api/rag/chat (Backend)
    │
    ├─ 验证参数
    ├─ 检查FAQ匹配
    │
    ▼
RAGService.SearchSimilarChunks()
    │
    ├─ 生成查询向量
    │  ├─ 尝试: Deepseek API
    │  └─ 回退: 本地向量
    │
    ├─ 查询SQLite获取所有块向量
    │
    ├─ 计算相似度 (cosine)
    │
    └─ 返回 Top-K 结果
    │
    ▼
RAGService.EnhanceQuery()
    │
    ├─ 组织相关文档
    ├─ 添加系统提示词
    ├─ 添加人设信息
    ├─ 添加压缩要求
    │
    └─ 返回增强查询
    │
    ▼
sendToN8N()
    │
    ├─ 构建n8n请求体
    ├─ 添加上下文和提示词
    │
    └─ HTTP POST 到 n8n
    │
    ▼
n8n AI Node
    │
    ├─ 接收提示词和上下文
    ├─ 调用Deepseek Chat API
    ├─ 获得AI回复
    │
    └─ 返回JSON响应
    │
    ▼
Backend 响应处理
    │
    ├─ 解析n8n响应
    ├─ 应用输出压缩
    │
    └─ 返回给Frontend
    │
    ▼
Frontend 显示结果
    │
    ├─ 显示参考资料 (RAG chunks)
    ├─ 显示AI回复
    │
    └─ 显示处理时间
```

## 并发和性能优化

### 1. 连接池配置

```go
// 数据库连接池
db.SetMaxIdleConns(10)
db.SetMaxOpenConns(100)

// HTTP客户端复用
httpClient := &http.Client{
    Timeout: 30 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns: 100,
        MaxConnsPerHost: 10,
    },
}
```

### 2. 缓存策略

```
┌─────────────────────────────────┐
│ Redis 缓存层                     │
├─────────────────────────────────┤
│ 1. FAQ精确匹配结果 (TTL: 1天)    │
│ 2. 用户会话信息 (TTL: 24小时)   │
│ 3. 热查询结果 (TTL: 1小时)      │
└─────────────────────────────────┘
```

### 3. 异步处理

```go
// 成员同步异步执行
go func() {
    if err := ragService.SyncMembersToMarkdown(); err != nil {
        log.Printf("异步同步失败: %v", err)
    }
}()
```

## 安全设计

### 1. 输入验证

```go
// 查询长度限制
if len(query) > 5000 {
    return errors.New("查询过长")
}

// 参数范围检查
if topK < 1 || topK > 50 {
    topK = 5
}
```

### 2. 错误处理

```go
// 不暴露内部错误详情
if err != nil {
    return c.JSON(500, map[string]interface{}{
        "error": "处理失败",
        // 不返回具体的内部错误
    })
}
```

### 3. 速率限制

```go
e.Use(middleware.RateLimiter(
    middleware.NewRateLimiterConfig().
    Store(middleware.NewRateLimiterMemoryStore(100))))
```

## 扩展性设计

### 1. 支持多个知识库源

```go
// 支持添加新的数据源
knowledgeSources := []string{
    "backend/AI-data-source",
    "backend/custom-knowledge",
    "backend/user-uploaded",
}
```

### 2. 可插拔的Embedding模型

```go
interface EmbeddingProvider {
    Generate(text string) ([]float64, error)
}

// 支持多种实现
- DeepseekEmbedding
- LocalEmbedding
- OpenAIEmbedding
```

### 3. 模块化的提示词管理

```go
type PromptTemplate struct {
    SystemPrompt   string
    PersonaInfo    string
    CompressionReq string
    OutputFormat   string
}
```

## 灾备和恢复

### 1. 数据备份

```bash
# 每日自动备份
0 2 * * * backup /path/to/app.db
```

### 2. 故障转移

```
主服务器 ─────→ 负载均衡器 ─────→ 备用服务器
                     ▲
                     │
              心跳检测 (每5秒)
```

### 3. 日志记录

```
┌────────────────────┐
│ 应用日志           │
│ - 请求日志         │
│ - 错误日志         │
│ - 性能日志         │
└────────────────────┘
```

## 总结

该架构设计强调：
- **模块化**：各功能独立，易于测试和维护
- **可扩展性**：支持添加新的数据源和embedding模型
- **性能**：通过缓存和连接池优化
- **可靠性**：错误处理和备份策略完善
- **安全**：输入验证和错误隐藏
