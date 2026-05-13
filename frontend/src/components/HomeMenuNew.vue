<template>
  <div>
    <a-space direction="horizontal" size="large" style="margin-top: 2em;">
      <a-button
        :type="isDark ? 'secondary' : 'primary'"
        :class="isDark ? 'dark-btn' : 'light-btn'"
        @click="handleMembersClick"
      >社团成员名单</a-button>
      <router-link to="/events">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="isDark ? 'dark-btn' : 'light-btn'"
        >社团活动事件</a-button>
      </router-link>
      <router-link to="/recruit">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="isDark ? 'dark-btn' : 'light-btn'"
        >社团招新</a-button>
      </router-link>
    </a-space>
    
    <!-- AI助手入口 -->
    <div style="margin-top: 1.5em;">
      <router-link to="/ai-assistant">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="[isDark ? 'dark-btn' : 'light-btn', 'ai-assistant-btn']"
          size="large"
        >
          🤖 视小姬 AI助手
        </a-button>
      </router-link>
    </div>
    
    <!-- 仅社团成员可见的功能 -->
    <div v-if="isMember" style="margin-top: 1em;">
      <a-space direction="horizontal" size="middle">
        <router-link to="/member-info">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="isDark ? 'dark-btn' : 'light-btn'"
            size="small"
          >登记信息</a-button>
        </router-link>
        <router-link to="/kb-manage">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="isDark ? 'dark-btn' : 'light-btn'"
            size="small"
          >知识库管理</a-button>
        </router-link>
      </a-space>
    </div>

    <!-- 用户状态和登出按钮 -->
    <div class="user-status" style="margin-top: 20px;">
      <a-space direction="vertical" size="small">
        <a-space>
          <a-tag :color="userType === 'member' ? 'blue' : 'orange'">
            {{ userType === 'member' ? '社团成员' : '访客模式' }}
          </a-tag>
          <span v-if="userInfo">{{ userInfo.cn }}</span>
        </a-space>
        
        <!-- 访客用户显示提示和切换按钮 -->
        <div v-if="userType === 'guest'" class="guest-tip">
          <p style="font-size: 0.85em; color: #666; margin: 5px 0;">
            当前为访客模式，功能受限
          </p>
          <a-button type="primary" size="small" @click="goToLogin">
            切换为成员登录
          </a-button>
        </div>
        
        <!-- 成员用户显示登出按钮 -->
        <a-button v-if="userType === 'member'" type="text" @click="logout">
          登出
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils/auth'

const props = defineProps({
  isDark: Boolean
})

const router = useRouter()
const isMember = ref(false)
const userType = ref('guest')
const userInfo = ref(null)

// 社团成员路由访问计数器
const membersClickCount = ref(0)
const maxClicksBeforeAdmin = 6 // 用户点击社团成员信息路由3次，退出3次，总共6次操作后弹出管理员登录

onMounted(() => {
  updateUserStatus()
  // 从localStorage获取点击计数
  const savedCount = localStorage.getItem('membersClickCount')
  if (savedCount) {
    membersClickCount.value = parseInt(savedCount)
  }
})

const handleMembersClick = () => {
  // 增加点击计数
  membersClickCount.value++
  localStorage.setItem('membersClickCount', membersClickCount.value.toString())
  
  // 检查是否达到触发条件
  if (membersClickCount.value >= maxClicksBeforeAdmin) {
    // 重置计数器
    membersClickCount.value = 0
    localStorage.setItem('membersClickCount', '0')
    
    // 跳转到管理员登录页面
    router.push('/admin-login')
  } else {
    // 正常跳转到社团成员页面
    router.push('/members')
  }
}

const updateUserStatus = () => {
  userType.value = auth.getUserType() || 'guest'
  isMember.value = auth.isMember()
  userInfo.value = auth.getUserInfo()
}

const logout = () => {
  auth.logout()
  router.push('/')
}

const goToLogin = () => {
  // 清除访客状态
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.dark-btn {
  background: #232324 !important;
  color: #fff !important;
  border: none;
}
.light-btn {
  background: #fff !important;
  color: #165dff !important;
  border: 1px solid #165dff !important;
}

.user-status {
  text-align: center;
  font-size: 0.9em;
}

.guest-tip {
  background: linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%);
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 10px;
  margin-top: 8px;
}

.guest-tip .arco-button {
  margin-top: 5px;
}

.ai-assistant-btn {
  font-size: 1.1em !important;
  padding: 12px 24px !important;
  height: auto !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.ai-assistant-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
