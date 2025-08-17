<template>
  <div>
    <a-space direction="horizontal" size="large" style="margin-top: 2em;">
      <router-link to="/members">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="isDark ? 'dark-btn' : 'light-btn'"
        >社团成员名单</a-button>
      </router-link>
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

onMounted(() => {
  updateUserStatus()
})

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
</style>
