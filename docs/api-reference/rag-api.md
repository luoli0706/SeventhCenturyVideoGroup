# RAG API 参考

## 基础信息

**Base URL**: `http://localhost:7777/api`

**Content-Type**: `application/json`

**认证**: 部分端点需要成员权限

## 端点列表

### 1. RAG查询

#### 请求

```http
POST /rag/query
Content-Type: application/json

{
  "query": "如何保证节奏同步感?",
  "top_k": 5,
  "category": ""
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| query | string | ✓ | 用户查询文本，不能为空 |
| top_k | int | ✗ | 返回的相似文档数量，默认5 |
| category | string | ✗ | 文档类别过滤，为空时不过滤 |

#### 响应

```json
{
  "query": "如何保证节奏同步感?",
  "relevant_chunks": [
    {
      "chunk_id": 1,
      "document_id": 1,
      "title": "MAD 知识核心",
      "content": "先用打点工具（如 Premiere Markers）标记音乐鼓点...",
      "similarity": 0.87,
      "category": "视频组知识库"
    }
  ],
  "enhanced_query": "根据以下相关知识回答问题：\n\n【相关资料1 - MAD 知识核心】\n...",
  "processing_time": 0.027
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| query | string | 原始用户查询 |
| relevant_chunks | array | 匹配到的文档块数组 |
| relevant_chunks[].chunk_id | int | 文档块ID |
| relevant_chunks[].similarity | float | 相似度评分(0-1) |
| relevant_chunks[].content | string | 文档块内容 |
| enhanced_query | string | 包含上下文的增强查询 |
| processing_time | float | 处理耗时(秒) |

#### 示例

```bash
curl -X POST http://localhost:7777/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "怎样制作MAD视频?",
    "top_k": 3,
    "category": ""
  }'
```

---

### 2. RAG聊天（检索+n8n）

#### 请求

```http
POST /rag/chat
Content-Type: application/json

{
  "query": "如何保证节奏同步感?",
  "top_k": 5,
  "category": ""
}
```

#### 参数说明

与 `/rag/query` 相同

#### 响应

包含所有RAG查询的信息，加上n8n处理的AI回复：

```json
{
  "query": "如何保证节奏同步感?",
  "relevant_chunks": [...],
  "enhanced_query": "...",
  "n8n_response": "根据知识库，保证节奏同步感的方法包括：\n1. 使用打点工具（如Premiere Markers）标记音乐鼓点...",
  "processing_time": 1.234
}
```

#### 示例

```bash
curl -X POST http://localhost:7777/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "怎样制作MAD视频?",
    "top_k": 3
  }'
```

---

### 3. 知识库刷新

#### 请求

```http
POST /rag/refresh
Content-Type: application/json
```

#### 响应

```json
{
  "message": "知识库刷新完成",
  "documents_processed": 2,
  "total_chunks": 53,
  "processing_time": 1.234,
  "details": [
    {
      "title": "视频组知识库（MAD & MMD）",
      "chunks": 37,
      "status": "success"
    },
    {
      "title": "柒世纪视频组成员信息",
      "chunks": 16,
      "status": "success"
    }
  ]
}
```

#### 功能说明

- 热加载所有markdown知识库文件
- 检测文件变化（通过MD5哈希）
- 生成新的向量块
- 无需重启服务

#### 示例

```bash
curl -X POST http://localhost:7777/api/rag/refresh
```

---

### 4. 成员信息同步

#### 请求

```http
POST /rag/sync-members
Content-Type: application/json
```

#### 响应

```json
{
  "message": "成员信息已同步到markdown文件",
  "members_synced": 15,
  "file_path": "backend/AI-data-source/社团成员信息.md",
  "sync_time": "2025-10-16T10:45:30Z"
}
```

#### 功能说明

- 将数据库中的成员信息导出到markdown
- 更新`backend/AI-data-source/社团成员信息.md`
- 触发自动热更新

#### 示例

```bash
curl -X POST http://localhost:7777/api/rag/sync-members
```

---

### 5. 知识库状态

#### 请求

```http
GET /rag/status
```

#### 响应

```json
{
  "status": "healthy",
  "documents_count": 2,
  "chunks_count": 53,
  "last_refresh": "2025-10-16T10:40:39Z",
  "details": {
    "documents": [
      {
        "id": 1,
        "title": "视频组知识库（MAD & MMD）",
        "category": "视频组知识库",
        "chunks": 37,
        "updated_at": "2025-10-16T10:40:39Z"
      },
      {
        "id": 7,
        "title": "柒世纪视频组成员信息",
        "category": "通用",
        "chunks": 16,
        "updated_at": "2025-10-16T10:41:02Z"
      }
    ]
  }
}
```

#### 功能说明

- 获取知识库整体状态
- 显示所有文档和块的统计
- 最后一次刷新时间

#### 示例

```bash
curl http://localhost:7777/api/rag/status
```

---

### 6. 获取文档列表

#### 请求

```http
GET /rag/documents?page=1&limit=10&category=
```

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 10 | 每页数量 |
| category | string | "" | 类别过滤 |

#### 响应

```json
{
  "documents": [
    {
      "id": 1,
      "title": "视频组知识库（MAD & MMD）",
      "category": "视频组知识库",
      "updated_at": "2025-10-16T10:40:39Z",
      "created_at": "2025-10-16T10:40:39Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

---

### 7. 获取FAQ列表

#### 请求

```http
GET /rag/faqs?category=
```

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| category | string | 类别过滤（可选） |

#### 响应

```json
{
  "faqs": [
    {
      "id": 1,
      "question": "你是谁?",
      "answer": "您好！我是柒世纪视频组专属的AI小助手视小姬...",
      "category": "general"
    }
  ],
  "total": 10
}
```

---

### 8. 初始化RAG系统

#### 请求

```http
POST /rag/initialize
Content-Type: application/json
```

#### 响应

```json
{
  "message": "RAG系统初始化成功",
  "processing_time": 1.234
}
```

#### 功能说明

- 从AI-data-source目录加载所有markdown文件
- 生成向量并存储到数据库
- 通常在服务启动时自动调用

---

## 错误处理

### 错误响应格式

```json
{
  "error": "错误信息",
  "details": "详细错误描述"
}
```

### 常见错误代码

| 状态码 | 错误 | 原因 | 解决方案 |
|--------|------|------|---------|
| 400 | Bad Request | 请求参数不合法 | 检查参数格式 |
| 500 | Internal Server Error | 服务器错误 | 检查日志 |
| 404 | Not Found | 端点不存在 | 检查API路径 |

### 示例错误

```json
{
  "error": "查询内容不能为空",
  "details": "query参数为必需且不能为空"
}
```

---

## 数据类型

### DocumentChunkResult

```typescript
interface DocumentChunkResult {
  chunk_id: number           // 文档块ID
  document_id: number        // 所属文档ID
  title: string             // 文档标题
  content: string           // 文档块内容
  similarity: number        // 相似度 (0-1)
  category: string          // 文档类别
}
```

### Document

```typescript
interface Document {
  id: number                // 文档ID
  title: string            // 文档标题
  category: string         // 文档类别
  updated_at: string       // 更新时间 (ISO 8601)
  created_at: string       // 创建时间 (ISO 8601)
}
```

---

## 速率限制

当前没有配置速率限制，但建议在生产环境中添加：

- 每个IP每分钟最多100次请求
- 每个用户每分钟最多500次请求

---

## 认证

大多数RAG端点不需要认证，但某些操作（如同步成员信息）可能需要管理员权限。

使用方式：
```http
Authorization: Bearer <token>
```

---

## 最佳实践

### 1. 查询优化

- 使用合适的`top_k`值（3-10之间通常效果最好）
- 提供清晰的查询文本
- 必要时使用类别过滤

### 2. 错误处理

```javascript
try {
  const response = await fetch('/api/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: userInput })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('RAG错误:', error.error);
  }
  
  const data = await response.json();
  // 处理数据
} catch (error) {
  console.error('网络错误:', error);
}
```

### 3. 缓存策略

- 缓存FAQ精确匹配结果
- 相同查询的结果可缓存30分钟
- 知识库刷新后清除相关缓存

### 4. 监控建议

- 记录查询延迟
- 监控相似度平均值
- 追踪错误率

---

## 版本历史

### v1.0.0 (2025-10-16)
- 初始发布
- RAG核心功能
- 热更新支持
- 成员同步功能

---

## 联系和支持

遇到问题？
- 查看[故障排除指南](../rag-system/hot-update-guide.md#故障排除)
- 提交Issue到GitHub
- 联系技术支持
