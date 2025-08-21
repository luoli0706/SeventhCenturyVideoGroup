# 快速入门

本指南将带您完成第一个 SVCG 功能的开发，从创建用户到管理成员资料。

## 前置条件

确保您已经完成：

- ✅ [环境安装](./installation.md)
- ✅ [项目配置](./configuration.md)
- ✅ 前后端服务正常启动

## 第一步：了解项目结构

### 前端结构

```
frontend/
├── src/
│   ├── views/          # 页面组件
│   │   ├── Home.vue           # 首页
│   │   ├── Members.vue        # 成员列表
│   │   ├── MemberProfile.vue  # 成员资料
│   │   └── LoginChoice.vue    # 登录选择
│   ├── components/     # 可复用组件
│   │   ├── SearchBox.vue      # 搜索组件
│   │   └── ThemeSwitcher.vue  # 主题切换
│   ├── router/         # 路由配置
│   ├── utils/          # 工具函数
│   └── style.css       # 全局样式
```

### 后端结构

```
backend/go-echo-sqlite/
├── controllers/        # 控制器
│   ├── auth_controller.go
│   ├── member_profile_controller.go
│   └── activity_controller.go
├── models/            # 数据模型
│   ├── member_profile.go
│   ├── activity.go
│   └── club_member.go
├── routes/            # 路由定义
└── config/            # 配置文件
```

## 第二步：体验核心功能

### 1. 访问首页

打开浏览器访问 `http://localhost:5173`，您将看到：

- 🎨 现代化的首页设计
- 🌓 深浅主题切换按钮
- 📱 响应式布局
- 🔍 搜索功能

### 2. 用户注册

点击"注册"按钮体验用户注册流程：

1. 填写用户名、邮箱、密码
2. 系统验证输入格式
3. 成功注册后自动登录

### 3. 成员管理

登录后访问"成员管理"页面：

1. 查看成员列表
2. 搜索特定成员
3. 查看成员详细资料
4. 编辑成员信息

## 第三步：开发第一个功能

让我们创建一个简单的"成员统计"功能。

### 后端开发

#### 1. 创建统计接口

在 `backend/go-echo-sqlite/controllers/` 目录创建 `stats_controller.go`：

```go
package controllers

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "path/to/your/project/models"
    "path/to/your/project/config"
)

func GetMemberStats(c echo.Context) error {
    var totalMembers int64
    var activeMembers int64
    
    // 获取总成员数
    config.DB.Model(&models.MemberProfile{}).Count(&totalMembers)
    
    // 获取活跃成员数（假设有 is_active 字段）
    config.DB.Model(&models.MemberProfile{}).Where("is_active = ?", true).Count(&activeMembers)
    
    stats := map[string]interface{}{
        "total_members":  totalMembers,
        "active_members": activeMembers,
        "inactive_members": totalMembers - activeMembers,
    }
    
    return c.JSON(http.StatusOK, map[string]interface{}{
        "success": true,
        "data":    stats,
    })
}
```

#### 2. 添加路由

在 `backend/go-echo-sqlite/routes/routes.go` 中添加：

```go
// 统计相关路由
api.GET("/stats/members", controllers.GetMemberStats)
```

### 前端开发

#### 1. 创建统计组件

在 `frontend/src/components/` 目录创建 `MemberStats.vue`：

```vue
<template>
  <div class="member-stats">
    <h3>成员统计</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <h4>总成员数</h4>
        <p class="stat-number">{{ stats.total_members || 0 }}</p>
      </div>
      <div class="stat-card">
        <h4>活跃成员</h4>
        <p class="stat-number">{{ stats.active_members || 0 }}</p>
      </div>
      <div class="stat-card">
        <h4>非活跃成员</h4>
        <p class="stat-number">{{ stats.inactive_members || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({})
const loading = ref(false)

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/stats/members')
    stats.value = response.data.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.member-stats {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: var(--color-bg-container);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
  margin: 10px 0;
}
</style>
```

#### 2. 集成到首页

在 `frontend/src/views/Home.vue` 中引入统计组件：

```vue
<template>
  <div class="home">
    <h1>欢迎来到 SVCG 社团管理系统</h1>
    <MemberStats />
    <!-- 其他内容 -->
  </div>
</template>

<script setup>
import MemberStats from '@/components/MemberStats.vue'
</script>
```

## 第四步：测试功能

### 1. 测试后端接口

使用 curl 或 Postman 测试：

```bash
curl -X GET http://localhost:8080/api/stats/members
```

预期响应：

```json
{
  "success": true,
  "data": {
    "total_members": 25,
    "active_members": 20,
    "inactive_members": 5
  }
}
```

### 2. 测试前端界面

1. 刷新浏览器页面
2. 查看统计卡片是否正确显示
3. 检查数据是否从 API 正确获取

## 第五步：常见开发模式

### 1. 创建新页面

```bash
# 1. 创建 Vue 组件
touch frontend/src/views/NewPage.vue

# 2. 添加路由
# 编辑 frontend/src/router/index.js

# 3. 添加导航链接
# 编辑相关组件
```

### 2. 添加新 API

```bash
# 1. 创建控制器方法
# 编辑或创建 controllers/xxx_controller.go

# 2. 添加路由
# 编辑 routes/routes.go

# 3. 前端调用
# 在 Vue 组件中使用 axios 调用
```

### 3. 数据库操作

```go
// 查询
var users []models.User
config.DB.Find(&users)

// 创建
user := models.User{Name: "张三"}
config.DB.Create(&user)

// 更新
config.DB.Model(&user).Update("name", "李四")

// 删除
config.DB.Delete(&user)
```

## 第六步：调试技巧

### 前端调试

1. **使用浏览器开发者工具**
   - F12 打开开发者工具
   - 查看 Console 面板的错误信息
   - 检查 Network 面板的 API 请求

2. **Vue Devtools**
   - 安装 Vue Devtools 浏览器扩展
   - 查看组件状态和数据流

### 后端调试

1. **查看服务器日志**
   ```bash
   # 后端服务器会输出请求日志
   2024/01/15 10:30:25 GET /api/stats/members - 200 - 15ms
   ```

2. **使用 Go 调试器**
   ```bash
   # 安装 delve
   go install github.com/go-delve/delve/cmd/dlv@latest
   
   # 调试模式启动
   dlv debug main.go
   ```

## 第七步：提交代码

### Git 工作流

```bash
# 1. 查看修改
git status

# 2. 添加文件
git add .

# 3. 提交更改
git commit -m "feat: 添加成员统计功能"

# 4. 推送到远程仓库
git push origin feature/member-stats
```

### 提交信息规范

使用约定式提交格式：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 添加测试

## 常见问题

### Q: 前端无法访问后端 API

**A:** 检查以下几点：
1. 后端服务是否正常启动（端口 8080）
2. 前端代理配置是否正确
3. CORS 设置是否允许前端域名

### Q: 数据库连接失败

**A:** 确认：
1. SQLite 文件是否有读写权限
2. 数据库文件路径是否正确
3. 是否正确导入了 sqlite 驱动

### Q: 页面样式不正确

**A:** 检查：
1. CSS 变量是否正确定义
2. 主题切换是否正常工作
3. 浏览器是否缓存了旧样式

## 下一步

恭喜！您已经完成了第一个功能的开发。接下来可以：

- 📚 深入学习 [前端开发指南](../development/frontend/)
- ⚙️ 了解 [后端开发指南](../development/backend/)
- 📋 查看 [API 文档](../api/)
- 🚀 准备 [生产部署](../deployment/)

## 获取帮助

如果遇到问题：

- 📖 查看 [故障排除指南](./troubleshooting.md)
- 💬 在 GitHub 上提交 Issue
- 📧 联系开发团队
