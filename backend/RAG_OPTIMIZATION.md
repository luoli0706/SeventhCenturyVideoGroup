# RAG 系统优化文档

## 优化概述

本次优化主要针对RAG（检索增强生成）系统进行了以下重大改进：

### 1. Embedding方法升级
**从本地特征提取 → Deepseek API调用**

- **原方案**：使用基于关键词和字符频率的本地特征向量（512维）
- **新方案**：调用Deepseek API生成高质量语义向量
- **优势**：
  - 更准确的语义理解
  - 更好的相似度计算
  - 降低维护成本

### 2. 语义压缩功能

实现了两层语义压缩机制：

#### 2.1 输入压缩 (`compressSemanticContent`)
- **时机**：在生成Embedding之前
- **逻辑**：
  - 提取包含关键词的句子
  - 删除冗余信息
  - 保留核心语义
  - 默认压缩至100字符
  
#### 2.2 输出压缩 (`compressOutputContent`)
- **时机**：n8n返回结果后
- **逻辑**：
  - 优先提取JSON格式的关键字段
  - 文本格式优先保留关键行（步骤、建议、要点等）
  - 删除无关的填充内容
  - 默认压缩至1000字符

#### 2.3 块内容压缩 (`compressChunkContent`)
- **时机**：发送给n8n前
- **逻辑**：
  - 压缩相关文档块内容
  - 保留包含关键词的句子
  - 减少API调用数据量
  - 默认压缩至500字符

### 3. 环境变量配置

创建了`.env`文件用于管理敏感配置信息：

```env
# Deepseek API Configuration
DEEPSEEK_API_KEY=sk-ebd9b6eaf5144b4489be23b22f103808

# Deepseek Embedding Model Configuration
DEEPSEEK_EMBEDDING_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com

# RAG Configuration
RAG_EMBEDDING_DIMENSION=1024
RAG_TOP_K=5
```

**配置说明：**
- `DEEPSEEK_API_KEY`：Deepseek API密钥（必需）
- `DEEPSEEK_EMBEDDING_MODEL`：使用的Embedding模型
- `DEEPSEEK_API_BASE`：API基础URL
- `RAG_EMBEDDING_DIMENSION`：Embedding向量维度
- `RAG_TOP_K`：检索返回的最相似文档数

### 4. 代码变更

#### 主要改动文件：

**backend/go-echo-sqlite/services/rag_service.go**
- 新增Deepseek Embedding API相关结构体
- 完全重写`generateEmbedding()`方法，调用Deepseek API
- 新增`compressSemanticContent()`方法
- 新增`compressOutput()`方法
- 更新`NewRAGService()`从环境变量读取配置

**backend/go-echo-sqlite/controllers/rag_controller.go**
- 修改`sendToN8N()`函数，集成语义压缩
- 新增`compressChunkContent()`方法
- 新增`compressOutputContent()`方法
- 添加`strings`包导入

**backend/go-echo-sqlite/main.go**
- 新增`.env`文件加载逻辑
- 导入`godotenv`包

**新建文件：**
- `.env`：生产环境配置（包含实际API密钥）
- `.env.example`：配置模板（供开发者参考）

### 5. 依赖更新

- 新增 `github.com/joho/godotenv v1.5.1` 用于环境变量管理

## 使用指南

### 初次设置

1. 确保`.env`文件在项目根目录
2. 配置有效的Deepseek API密钥
3. 启动应用时会自动加载环境变量

```bash
cd backend/go-echo-sqlite
go build
./go-echo-sqlite
```

### 关键函数说明

#### SearchSimilarChunks()
- 使用Deepseek生成的向量进行相似度搜索
- 调用`cosineSimilarity()`计算向量相似度
- 返回相关度最高的文档块

#### EnhanceQuery()
- 结合检索到的文档块增强原始查询
- 构建发送给n8n的完整上下文

#### ProcessMarkdownFile()
- 加载Markdown文档时自动生成Embedding
- 使用新的Deepseek API而不是本地特征

## 性能优化

| 方面 | 改进 |
|------|------|
| Embedding质量 | 从简单特征 → 深度语义理解 |
| 网络流量 | 通过压缩减少API调用数据量 |
| 响应时间 | 压缩删除冗余信息，加快处理 |
| 准确性 | Deepseek API提供更好的语义理解 |

## 安全考虑

- API密钥存储在`.env`文件中，不应提交到版本控制
- `.env.example`提供配置模板供开发者参考
- 建议在生产环境使用密钥管理系统

## 故障排除

### 无法加载.env文件
```
警告: 无法加载.env文件，将使用环境变量或默认配置
```
- 检查`.env`文件是否存在于工作目录
- 或设置环境变量：`DEEPSEEK_API_KEY`

### Deepseek API调用失败
- 验证API密钥有效性
- 检查网络连接
- 查看应用日志了解详细错误信息

### Embedding维度不匹配
- 确保`RAG_EMBEDDING_DIMENSION`与实际使用的模型一致
- 默认为1024维，不应轻易改动

## 未来改进方向

1. 实现Embedding缓存，提高重复查询性能
2. 支持多种Embedding模型选择
3. 动态调整压缩参数
4. 添加压缩效果监控和统计

---

**更新时间**：2025年10月16日
**版本**：2.0 (Deepseek集成版本)
