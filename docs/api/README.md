# API 文档

SVCG 社团管理系统 RESTful API 文档。

## 基础信息

- **Base URL**: `http://localhost:8080/api`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证方式

API 使用 JWT (JSON Web Token) 进行身份认证。

### 获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

### 使用 Token

在请求头中包含 Authorization 字段：

```http
Authorization: Bearer <your_jwt_token>
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {
      // 详细错误信息
    }
  }
}
```

## 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## API 接口列表

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/logout` | 用户登出 |
| POST | `/auth/refresh` | 刷新 Token |
| POST | `/auth/forgot-password` | 忘记密码 |
| POST | `/auth/reset-password` | 重置密码 |

### 成员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/members` | 获取成员列表 |
| GET | `/members/{id}` | 获取成员详情 |
| POST | `/members` | 创建成员 |
| PUT | `/members/{id}` | 更新成员信息 |
| DELETE | `/members/{id}` | 删除成员 |

### 成员资料

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/profiles` | 获取资料列表 |
| GET | `/profiles/{id}` | 获取资料详情 |
| POST | `/profiles` | 创建资料 |
| PUT | `/profiles/{id}` | 更新资料 |
| DELETE | `/profiles/{id}` | 删除资料 |

### 活动管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/activities` | 获取活动列表 |
| GET | `/activities/{id}` | 获取活动详情 |
| POST | `/activities` | 创建活动 |
| PUT | `/activities/{id}` | 更新活动 |
| DELETE | `/activities/{id}` | 删除活动 |

### 系统管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/info` | 系统信息 |
| GET | `/stats` | 统计数据 |

## 请求示例

### curl 示例

```bash
# 登录获取 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 使用 token 访问受保护的接口
curl -X GET http://localhost:8080/api/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript 示例

```javascript
// 登录
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  })
})

const loginData = await loginResponse.json()
const token = loginData.data.token

// 获取成员列表
const membersResponse = await fetch('/api/members', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const membersData = await membersResponse.json()
```

## 分页

对于返回列表的接口，支持分页参数：

### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码 |
| pageSize | integer | 20 | 每页数量 |
| sort | string | id | 排序字段 |
| order | string | asc | 排序方向 (asc/desc) |

### 响应格式

```json
{
  "success": true,
  "data": {
    "items": [
      // 数据列表
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 搜索过滤

支持搜索和过滤的接口可以使用以下参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| search | string | 搜索关键词 |
| filter[field] | string | 字段过滤 |
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |

### 示例

```http
GET /api/members?search=张三&filter[department]=技术部&page=1&pageSize=10
```

## 错误码

### 通用错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_REQUEST | 请求格式错误 |
| VALIDATION_ERROR | 数据验证失败 |
| UNAUTHORIZED | 未授权访问 |
| FORBIDDEN | 权限不足 |
| NOT_FOUND | 资源不存在 |
| CONFLICT | 资源冲突 |
| INTERNAL_ERROR | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| USER_NOT_FOUND | 用户不存在 |
| INVALID_CREDENTIALS | 用户名或密码错误 |
| EMAIL_ALREADY_EXISTS | 邮箱已存在 |
| USERNAME_ALREADY_EXISTS | 用户名已存在 |
| TOKEN_EXPIRED | Token 已过期 |
| TOKEN_INVALID | Token 无效 |

## 速率限制

为防止滥用，API 实施了速率限制：

- **游客**: 每分钟 100 请求
- **登录用户**: 每分钟 1000 请求
- **管理员**: 无限制

超出限制时将返回 429 状态码。

## 版本控制

API 版本通过 URL 路径进行控制：

- 当前版本: `/api/v1/`
- 未来版本: `/api/v2/`

## WebSocket

对于实时功能，提供 WebSocket 连接：

```javascript
const ws = new WebSocket('ws://localhost:8080/ws')

ws.onopen = () => {
  console.log('WebSocket 连接已建立')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('收到消息:', data)
}
```

## SDK 和工具

### JavaScript SDK

```bash
npm install @svcg/api-client
```

```javascript
import { SVCGClient } from '@svcg/api-client'

const client = new SVCGClient({
  baseURL: 'http://localhost:8080/api',
  token: 'your_jwt_token'
})

// 使用 SDK
const members = await client.members.list()
const member = await client.members.get(1)
```

### Postman Collection

下载 Postman 集合：[SVCG API Collection](./postman-collection.json)

## 接口详情

详细的接口文档请查看：

- [认证接口](./auth.md)
- [成员管理接口](./members.md)
- [活动管理接口](./activities.md)
- [资料管理接口](./profiles.md)

## 更新日志

### v1.2.0 (2025-01-15)
- 新增活动管理接口
- 优化分页性能
- 增加搜索功能

### v1.1.0 (2024-12-20)
- 新增成员资料接口
- 支持文件上传
- 改进错误处理

### v1.0.0 (2024-11-30)
- 初始版本发布
- 基础认证和成员管理功能
