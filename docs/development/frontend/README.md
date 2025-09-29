# 前端开发指南

本指南详细介绍 SVCG 前端应用的开发规范、架构设计和最佳实践。

## 技术栈概览

- **Vue 3**: 使用 Composition API 和 `<script setup>` 语法
- **Vite**: 快速的构建工具和开发服务器
- **Arco Design**: 企业级 Vue 3 组件库
- **Vue Router**: 单页应用路由管理
- **Pinia**: 现代化状态管理库
- **Axios**: HTTP 请求库

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   ├── components/        # 可复用组件
│   ├── router/           # 路由配置
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── index.html            # HTML 模板
├── package.json          # 依赖配置
└── vite.config.js        # Vite 配置
```

## 开发环境配置

### 环境变量

创建环境配置文件：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=SVCG 开发环境

# .env.production  
VITE_API_BASE_URL=https://api.svcg.com/api
VITE_APP_TITLE=SVCG 社团管理系统
```

### Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

## 组件开发规范

### 组件命名

- 使用 PascalCase 命名组件文件
- 组件名应该是多个单词组成，避免与 HTML 元素冲突

```vue
<!-- ✅ 好的命名 -->
<template>
  <UserProfile />
  <MemberCard />
  <SearchBox />
</template>

<!-- ❌ 避免的命名 -->
<template>
  <Profile />
  <Card />
  <Box />
</template>
```

### 组件结构

使用统一的组件结构：

```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
// 1. 导入依赖
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Props 定义
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  }
})

// 3. Emits 定义
const emit = defineEmits(['update', 'delete'])

// 4. 响应式数据
const loading = ref(false)
const form = ref({})

// 5. 计算属性
const displayTitle = computed(() => {
  return props.title.toUpperCase()
})

// 6. 方法定义
const handleSubmit = () => {
  emit('update', form.value)
}

// 7. 生命周期钩子
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
```

### Props 验证

使用详细的 Props 验证：

```javascript
const props = defineProps({
  // 基础类型检查
  status: String,
  
  // 多类型检查
  id: [String, Number],
  
  // 必需的字符串
  title: {
    type: String,
    required: true
  },
  
  // 带默认值的数字
  count: {
    type: Number,
    default: 0
  },
  
  // 带默认值的数组
  items: {
    type: Array,
    default: () => []
  },
  
  // 自定义验证函数
  email: {
    type: String,
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
  }
})
```

### 事件处理

```vue
<template>
  <div>
    <button @click="handleClick">点击</button>
    <input @input="handleInput" v-model="inputValue">
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['click', 'input-change'])

const inputValue = ref('')

const handleClick = () => {
  emit('click', { timestamp: Date.now() })
}

const handleInput = (event) => {
  emit('input-change', event.target.value)
}
</script>
```

## 路由管理

### 路由配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginChoice.vue')
  },
  {
    path: '/members',
    name: 'Members',
    component: () => import('@/views/Members.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:id',
    name: 'Profile',
    component: () => import('@/views/MemberProfile.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

### 路由导航

```vue
<template>
  <div>
    <!-- 声明式导航 -->
    <router-link to="/members">成员列表</router-link>
    <router-link :to="{ name: 'Profile', params: { id: userId } }">
      个人资料
    </router-link>
    
    <!-- 编程式导航 -->
    <button @click="goToProfile">查看资料</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToProfile = () => {
  router.push({ name: 'Profile', params: { id: 123 } })
}
</script>
```

## 状态管理

### Pinia Store 设计

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('auth_token'))
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => {
    return userInfo.value?.nickname || userInfo.value?.username || '游客'
  })
  
  // Actions
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { user, token: authToken } = response.data
      
      userInfo.value = user
      token.value = authToken
      localStorage.setItem('auth_token', authToken)
      
      return response
    } catch (error) {
      throw error
    }
  }
  
  const logout = () => {
    userInfo.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }
  
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      userInfo.value = { ...userInfo.value, ...response.data }
      return response
    } catch (error) {
      throw error
    }
  }
  
  return {
    userInfo,
    token,
    isLoggedIn,
    displayName,
    login,
    logout,
    updateProfile
  }
})
```

### Store 使用

```vue
<template>
  <div>
    <div v-if="userStore.isLoggedIn">
      欢迎，{{ userStore.displayName }}！
      <button @click="handleLogout">退出登录</button>
    </div>
    <div v-else>
      <button @click="showLogin">登录</button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  // 重定向到首页
  router.push('/')
}
</script>
```

## HTTP 请求处理

### API 工具封装

```javascript
// utils/api.js
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API 方法封装
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh')
}

export const memberAPI = {
  getMembers: (params) => api.get('/members', { params }),
  getMember: (id) => api.get(`/members/${id}`),
  createMember: (data) => api.post('/members', data),
  updateMember: (id, data) => api.put(`/members/${id}`, data),
  deleteMember: (id) => api.delete(`/members/${id}`)
}

export default api
```

### 在组件中使用 API

```vue
<template>
  <div class="member-list">
    <div v-if="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <member-card 
        v-for="member in members" 
        :key="member.id" 
        :member="member"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { memberAPI } from '@/utils/api'
import MemberCard from '@/components/MemberCard.vue'

const members = ref([])
const loading = ref(false)
const error = ref('')

const fetchMembers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await memberAPI.getMembers()
    members.value = response.data
  } catch (err) {
    error.value = '获取成员列表失败'
    console.error('获取成员列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleEdit = (member) => {
  // 编辑逻辑
}

const handleDelete = async (memberId) => {
  try {
    await memberAPI.deleteMember(memberId)
    members.value = members.value.filter(m => m.id !== memberId)
  } catch (err) {
    console.error('删除失败:', err)
  }
}

onMounted(() => {
  fetchMembers()
})
</script>
```

## 样式规范

### CSS 变量

使用 CSS 变量定义主题：

```css
/* style.css */
:root {
  /* 主色调 */
  --color-primary: #1677ff;
  --color-primary-hover: #4096ff;
  --color-primary-active: #0958d9;
  
  /* 辅助色 */
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-error: #ff4d4f;
  
  /* 文本颜色 */
  --color-text-primary: #000000d9;
  --color-text-secondary: #00000073;
  --color-text-disabled: #00000040;
  
  /* 背景色 */
  --color-bg-base: #ffffff;
  --color-bg-container: #ffffff;
  --color-bg-layout: #f5f5f5;
  
  /* 边框 */
  --border-radius: 6px;
  --border-color: #d9d9d9;
}
```

### 组件样式

```vue
<style scoped>
.member-card {
  background: var(--color-bg-container);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}

.member-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  margin-left: 12px;
}

.member-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.member-role {
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
```

## 性能优化

### 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/members',
    component: () => import('@/views/Members.vue')
  }
]

// 组件懒加载
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  loadingComponent: () => import('@/components/Loading.vue'),
  errorComponent: () => import('@/components/Error.vue'),
  delay: 200,
  timeout: 3000
})
```

### 列表虚拟滚动

对于大量数据的列表，使用虚拟滚动：

```vue
<template>
  <virtual-list
    :items="members"
    :item-height="80"
    :visible-count="10"
  >
    <template #item="{ item }">
      <member-card :member="item" />
    </template>
  </virtual-list>
</template>
```

## 测试

### 单元测试

```javascript
// tests/components/MemberCard.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MemberCard from '@/components/MemberCard.vue'

describe('MemberCard', () => {
  const mockMember = {
    id: 1,
    name: '张三',
    role: '技术部',
    avatar: '/avatar.jpg'
  }
  
  it('正确渲染成员信息', () => {
    const wrapper = mount(MemberCard, {
      props: { member: mockMember }
    })
    
    expect(wrapper.find('.member-name').text()).toBe('张三')
    expect(wrapper.find('.member-role').text()).toBe('技术部')
  })
  
  it('点击编辑按钮触发事件', async () => {
    const wrapper = mount(MemberCard, {
      props: { member: mockMember }
    })
    
    await wrapper.find('.edit-btn').trigger('click')
    expect(wrapper.emitted().edit).toBeTruthy()
  })
})
```

## 构建部署

### 生产构建

```bash
npm run build
```

### 构建优化配置

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@arco-design/web-vue']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## 下一步

- 📚 查看 [API 文档](/api/)
- 🗄️ 了解 [数据库设计](../database.md)
- 🚀 学习 [部署指南](/deployment/)
