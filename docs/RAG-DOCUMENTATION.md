# 文档中心

欢迎来到柒世纪视频组系统文档。这里包含了系统架构、API参考、部署指南等全面的技术文档。

## 📚 文档导航

### 🎯 快速开始

- **[部署指南](deployment/deployment-guide.md)** - 从零开始部署系统
  - 本地开发环境
  - Docker容器化部署
  - Kubernetes集群部署
  - 生产环境配置

### 🧠 RAG系统（AI助手核心）

RAG（检索增强生成）系统是AI助手的大脑，为n8n工作流引擎提供精准的知识库上下文。

#### 核心文档
- **[RAG系统概述](rag-system/overview.md)** - RAG系统架构、特性和工作流
  - 系统架构图
  - 核心特性介绍
  - 工作流程说明
  - 性能指标

- **[热更新指南](rag-system/hot-update-guide.md)** - 知识库热更新和成员同步
  - 自动检测更新
  - 手动刷新方法
  - 成员信息同步
  - 故障排除
  - 性能优化

#### API参考
- **[RAG API 参考](api-reference/rag-api.md)** - 完整的API文档
  - `/api/rag/query` - RAG查询接口
  - `/api/rag/chat` - 聊天接口（集成n8n）
  - `/api/rag/refresh` - 知识库刷新
  - `/api/rag/sync-members` - 成员同步
  - `/api/rag/status` - 状态查询

### 🏗️ 系统设计

- **[系统架构设计](architecture/system-architecture.md)** - 深入理解系统设计
  - 整体架构图
  - 核心模块详解
  - 交互流程图
  - 并发和性能优化
  - 安全设计
  - 扩展性设计

### 📖 开发相关

- **[前端文档](../frontend/README.md)** - Vue.js前端开发
- **[后端文档](../backend/README.md)** - Go后端服务开发

## 🔧 常见任务

### 添加新的知识库内容

1. 在 `backend/AI-data-source/` 目录中创建新的 `.md` 文件
2. 编写Markdown格式的内容
3. 调用 `/api/rag/refresh` 端点刷新知识库
4. 系统会自动检测和处理新文件

详见：[热更新指南 - 添加新知识库文件](rag-system/hot-update-guide.md#1-添加新知识库文件)

### 同步社团成员信息

当数据库中添加了新的社团成员时，需要同步到markdown文件：

```bash
curl -X POST http://localhost:7777/api/rag/sync-members
```

详见：[热更新指南 - 成员信息同步](rag-system/hot-update-guide.md#成员信息同步)

### 修改AI助手人设

编辑 `backend/go-echo-sqlite/controllers/rag_controller.go` 中的 `buildSystemPrompt()` 函数：

```go
func buildSystemPrompt() string {
    prompt := `【系统提示】
    你是柒世纪视频组的AI小助理...
    `
    return prompt
}
```

详见：[RAG系统概述 - 人设约束系统](rag-system/overview.md#4-人设约束系统)

### 调整API费用成本

系统内置的压缩机制可以减少API调用成本。如需进一步优化：

1. 调整输入压缩的 `maxLength` 参数
2. 修改输出压缩的保留关键字列表
3. 优化 `top_k` 值以减少向量比对

详见：[RAG系统概述 - 语义压缩优化](rag-system/overview.md#3-语义压缩优化)

## 📊 架构总览

### 系统堆栈

```
前端层
└─ Vue.js 3 + Vite + Arco Design

API层
└─ Go Echo Framework

业务层
├─ RAG检索 (Embedding + 向量搜索)
├─ 成员管理
└─ 认证授权

数据层
├─ SQLite (主数据库)
├─ Redis (缓存)
└─ Markdown (知识库文件)

外部服务
└─ n8n (AI工作流)
└─ Deepseek API (Embedding模型)
```

### 数据流

```
用户输入 → RAG检索 → 上下文构建 → n8n处理 → AI回复 → 显示结果
          ↓
        知识库 (Markdown)
        向量数据库 (SQLite)
        缓存 (Redis)
```

## 📈 性能指标

| 指标 | 值 | 说明 |
|------|-----|------|
| API响应时间 | ~50-100ms | 含n8n处理时间 |
| RAG查询响应 | ~27ms | 仅本地向量处理 |
| 并发连接数 | 100+ | 可按需扩展 |
| 知识库块数 | 53+ | 支持无限扩展 |
| 向量维度 | 1024 | Deepseek标准 |

## 🚀 快速链接

### 开发人员
- [系统架构设计](architecture/system-architecture.md) - 理解系统设计
- [RAG API参考](api-reference/rag-api.md) - 调用API
- [热更新指南](rag-system/hot-update-guide.md) - 管理知识库

### 运维人员
- [部署指南](deployment/deployment-guide.md) - 部署和维护
- [故障排除](rag-system/hot-update-guide.md#故障排除) - 问题解决

### 产品经理
- [RAG系统概述](rag-system/overview.md) - 理解系统功能
- [API参考](api-reference/rag-api.md) - 了解可用功能

## 📞 获取帮助

遇到问题？
1. 查看相关文档中的故障排除部分
2. 检查系统日志：`tail -f /var/log/scvg-backend.log`
3. 验证配置文件：检查 `.env` 中的环境变量
4. 联系技术支持或提交Issue

## 📝 文档更新历史

| 日期 | 更新内容 | 版本 |
|------|---------|------|
| 2025-10-16 | 初始文档版本 | 1.0.0 |
| | RAG系统文档 | |
| | 热更新指南 | |
| | API参考 | |
| | 部署指南 | |
| | 架构设计 | |

## 📄 文档结构

```
docs/
├── README.md (本文件)
├── rag-system/
│   ├── overview.md          # RAG系统概述
│   └── hot-update-guide.md  # 热更新指南
├── api-reference/
│   └── rag-api.md          # API参考
├── architecture/
│   └── system-architecture.md # 系统架构
└── deployment/
    └── deployment-guide.md  # 部署指南
```

## 📋 贡献指南

欢迎改进文档！在提交更新前：

1. 遵循现有的文档格式和风格
2. 使用清晰的标题和结构
3. 提供代码示例
4. 更新对应的导航和索引

## 📜 许可证

本项目文档采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可。

---

**最后更新**：2025年10月16日  
**文档版本**：1.0.0
