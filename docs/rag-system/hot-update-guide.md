# RAG系统热更新指南

## 概述

热更新机制允许在不重启后端服务的情况下，实时更新知识库内容。这包括：
- 新增/修改markdown知识库文件
- 更新社团成员信息

## 热更新机制

### 自动检测更新

启动时，系统会自动：
1. 扫描`backend/AI-data-source/`目录中的所有.md文件
2. 计算文件MD5哈希值与数据库中的记录对比
3. 如果哈希值不同，说明文件已更新，自动重新处理
4. 生成新的向量块并存储到SQLite

### 手动触发刷新

如果自动检测未生效，可以手动调用刷新API：

```bash
curl -X POST http://localhost:7777/api/rag/refresh \
  -H "Content-Type: application/json"
```

**响应示例**：
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

## 知识库更新工作流

### 1. 添加新知识库文件

**步骤**：
1. 在`backend/AI-data-source/`目录中创建新的.md文件
2. 按照Markdown格式编写内容
3. 调用`/api/rag/refresh`端点
4. 系统会自动处理新文件并生成向量

**示例**：添加MMD创作指南

```bash
# 1. 创建文件
touch backend/AI-data-source/mmd-guide.md

# 2. 编写内容（可使用编辑器）
# 3. 刷新知识库
curl -X POST http://localhost:7777/api/rag/refresh
```

### 2. 修改现有知识库

**步骤**：
1. 编辑对应的.md文件
2. 文件保存时系统自动检测到变化（通过哈希对比）
3. 下次查询时使用新内容

**注意**：
- 系统通过MD5哈希检测文件变化
- 如果只是修改了格式但内容相同，不会重新处理
- 为了强制刷新，可以调用`/api/rag/refresh`

### 3. 删除知识库文件

**步骤**：
1. 从`backend/AI-data-source/`目录中删除.md文件
2. 调用`/api/rag/refresh`端点
3. 系统会清理与该文件相关的所有向量块

## 成员信息同步

### 自动同步

当数据库中的成员信息发生变化时，系统不会自动更新markdown。需要手动触发同步。

### 手动同步

```bash
curl -X POST http://localhost:7777/api/rag/sync-members \
  -H "Content-Type: application/json"
```

**响应示例**：
```json
{
  "message": "成员信息已同步到markdown文件",
  "members_synced": 15,
  "file_path": "backend/AI-data-source/社团成员信息.md",
  "sync_time": "2025-10-16T10:45:30Z"
}
```

### 同步的信息

生成的markdown包含以下字段：
- 成员昵称 (cn)
- 成员类型 (role)
- 邮箱 (email)
- 加入时间 (created_at)
- 个人介绍

### 集成到业务流程

**在创建/更新成员时调用同步**：

```go
// 在club_member_controller.go的创建成员函数中
func CreateClubMember(c echo.Context) error {
    // ... 创建成员的逻辑 ...
    
    // 同步成员信息到markdown
    if err := ragService.SyncMembersToMarkdown(); err != nil {
        // 记录错误但不影响主流程
        fmt.Printf("同步成员信息失败: %v\n", err)
    }
    
    // ... 返回响应 ...
}
```

## 检查知识库状态

### 获取状态信息

```bash
curl http://localhost:7777/api/rag/status
```

**响应示例**：
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

## 最佳实践

### 1. 定期备份

```bash
# 备份知识库
cp -r backend/AI-data-source/ backend/AI-data-source.backup/

# 备份数据库
cp backend/go-echo-sqlite/app.db backend/go-echo-sqlite/app.db.backup
```

### 2. 版本管理

在markdown文件中添加版本信息：

```markdown
---
version: 1.0.0
last_updated: 2025-10-16
author: AI-Assistant
---
```

### 3. 监控刷新日志

启动服务时查看输出日志：

```
✓ 已处理文档: 视频组知识库（MAD & MMD） (分块数: 37, ID: 1)
✓ 已处理文档: 柒世纪视频组成员信息 (分块数: 16, ID: 7)
【诊断】文档总数: 2
【诊断】文档块总数: 53
```

### 4. 增量更新

- 不要删除整个AI-data-source目录，只修改特定文件
- 每次更新后验证相似度检索是否正常
- 测试新知识库内容是否被正确检索

## 故障排除

### 问题1：文件更新后仍未生效

**原因**：
- 文件尚未被系统检测到
- 哈希值计算有误
- 向量生成失败

**解决方案**：
1. 调用`/api/rag/refresh`强制刷新
2. 检查文件权限是否正确
3. 查看日志是否有错误信息

### 问题2：刷新时出现504错误

**原因**：知识库文件过大，处理超时

**解决方案**：
1. 检查AI-data-source目录中是否有超大文件
2. 将大文件分成多个小文件
3. 增加HTTP请求超时时间

### 问题3：成员同步文件格式混乱

**原因**：markdown模板格式问题

**解决方案**：
1. 检查`SyncMembersToMarkdown()`函数中的模板
2. 确保文件编码为UTF-8
3. 验证数据库中没有特殊字符

### 问题4：热更新后相似度计算不准确

**原因**：
- 向量维度不匹配
- 使用了不同的embedding模型

**解决方案**：
1. 检查Deepseek API是否正常工作
2. 确认环境变量DEEPSEEK_API_KEY已设置
3. 查看是否有本地向量回退的警告信息

## 性能优化

### 1. 减少刷新频率

```go
// 仅在必要时调用刷新
const REFRESH_INTERVAL = 1 * time.Hour  // 每小时最多刷新一次
```

### 2. 并发处理

系统已支持并发文件处理，可同时处理多个markdown文件。

### 3. 增量更新

每次刷新时，系统只重新处理哈希值不同的文件：

```go
if calculatedHash == storedHash {
    // 文件未变，跳过处理
    continue
}
```

## 高级配置

### 自定义刷新间隔

在`rag_service.go`中修改：

```go
const AUTO_REFRESH_INTERVAL = 5 * time.Minute  // 自动刷新间隔
```

### 修改文件监控路径

```go
// 监控多个目录
dataSourcePaths := []string{
    "backend/AI-data-source",
    "backend/custom-knowledge",
}
```

### 调整向量块大小

在`rag_service.go`的`splitDocument()`中修改：

```go
if len(section) <= 1500 {  // 修改此值调整块大小
    // ...
}
```

## 监控和告警

### 建议的监控指标

1. **知识库更新频率**：每小时多少次刷新
2. **平均刷新耗时**：通常应该 < 5秒
3. **失败率**：刷新失败的比例
4. **文档块总数趋势**：知识库增长情况

### 告警阈值

- 刷新耗时超过10秒 → 检查文件大小
- 连续3次刷新失败 → 检查系统日志
- 文档块数突然下降 → 检查是否有文件被删除

## 总结

热更新机制为RAG系统提供了灵活的知识库管理能力，结合手动刷新和自动检测，确保AI助手始终能访问最新的知识内容。
