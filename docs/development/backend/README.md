# 后端开发指南

欢迎来到柒世纪视频组系统的后端开发指南。本指南涵盖了Go后端的开发环境搭建、架构设计、API开发等内容。

## 📋 内容概览

- **[环境搭建](setup.md)** - 后端开发环境配置
- **[项目结构](structure.md)** - 项目文件夹组织说明
- **[开发流程](workflow.md)** - 日常开发工作流

## 🚀 快速开始

### 系统要求

- Go 1.18 或更高版本
- SQLite3
- Git

### 启动服务

```bash
cd backend/go-echo-sqlite
go run main.go
```

服务将运行在 `http://localhost:7777`

## 📚 核心文档

### RAG系统相关

- **[RAG系统概述](../../rag-system/overview.md)** - 检索增强生成系统
- **[RAG API 参考](../../api-reference/rag-api.md)** - 完整的RAG API文档
- **[热更新指南](../../rag-system/hot-update-guide.md)** - 知识库热更新

### 数据库相关

- **[数据库设计](database.md)** - 数据库架构和模型设计

## 🏗️ 技术栈

- **框架**：Echo Web Framework
- **ORM**：GORM
- **数据库**：SQLite3
- **向量数据库**：内嵌JSON存储（支持升级到Milvus）
- **外部API**：Deepseek Embedding API

## 🔑 关键文件

```
backend/go-echo-sqlite/
├── main.go                 # 应用入口
├── go.mod                  # 模块依赖
├── config/                 # 配置模块
├── controllers/            # 控制器层
├── services/               # 业务逻辑层
├── models/                 # 数据模型
├── routes/                 # 路由定义
└── AI-data-source/         # 知识库文件
```

## 📖 主要特性

1. **RESTful API** - 标准的HTTP API接口
2. **RAG系统** - 基于Deepseek的向量检索
3. **热更新支持** - 知识库无需重启即可更新
4. **成员管理** - 完整的社团成员信息管理
5. **活动管理** - 社团活动组织和发布
6. **认证系统** - 安全的用户认证机制

## 🔗 相关链接

- [完整API参考](../../api-reference/rag-api.md)
- [系统架构设计](../../architecture/system-architecture.md)
- [部署指南](../../deployment/deployment-guide.md)

---

更多详细内容，请参考相关文档。
