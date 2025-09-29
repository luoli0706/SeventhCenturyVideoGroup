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
      
      <!-- 仅社团成员可见的功能 -->
      <template v-if="isMember">
        <router-link to="/member-info">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="isDark ? 'dark-btn' : 'light-btn'"
          >登记信息</a-button>
        </router-link>
      </template>
    </a-space>
    
    <!-- 用户状态和登出按钮 -->
    <div class="user-status" style="margin-top: 20px;">
      <a-space>
        <a-tag :color="userType === 'member' ? 'blue' : 'gray'">
          {{ userType === 'member' ? '社团成员' : '访客' }}
        </a-tag>
        <span v-if="userInfo">{{ userInfo.cn }}</span>
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
</script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils/auth'
defineProps({
  isDark: Boolean
})
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
</style>