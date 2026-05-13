<template>
  <div>
    <!-- 主功能导航 -->
    <div :class="['nav-card', isDark ? 'nav-card-dark' : 'nav-card-light']">
      <div class="nav-card-label">导航</div>
      <a-space direction="horizontal" size="large">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="[isDark ? 'dark-btn' : 'light-btn', 'nav-btn']"
          @click="handleMembersClick"
        >社团成员名单</a-button>
        <router-link to="/events">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="[isDark ? 'dark-btn' : 'light-btn', 'nav-btn']"
          >社团活动事件</a-button>
        </router-link>
        <router-link to="/recruit">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="[isDark ? 'dark-btn' : 'light-btn', 'nav-btn']"
          >社团招新</a-button>
        </router-link>
        <router-link to="/games">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="[isDark ? 'dark-btn' : 'light-btn', 'nav-btn']"
          >奇怪的小游戏</a-button>
        </router-link>
      </a-space>
    </div>

    <!-- AI助手入口 -->
    <div style="margin-top: 1.2em;">
      <router-link to="/ai-assistant">
        <a-button
          :type="isDark ? 'secondary' : 'primary'"
          :class="[isDark ? 'dark-btn' : 'light-btn', 'ai-assistant-btn']"
          size="large"
        >
          <span class="ai-btn-content">
            <span class="ai-icon">🤖</span>
            <span class="ai-text">视小姬 AI助手</span>
            <span class="ai-arrow">→</span>
          </span>
        </a-button>
      </router-link>
    </div>

    <!-- 仅社团成员可见的功能 -->
    <div v-if="isMember" class="member-section">
      <div class="member-section-label">成员功能</div>
      <a-space direction="horizontal" size="middle">
        <router-link to="/kb-manage">
          <a-button
            :type="isDark ? 'secondary' : 'primary'"
            :class="[isDark ? 'dark-btn' : 'light-btn', 'member-btn']"
            size="small"
          >知识库管理</a-button>
        </router-link>
      </a-space>
    </div>

    <!-- 用户状态 -->
    <div class="user-status" style="margin-top: 24px;">
      <a-space direction="vertical" size="small">
        <a-space>
          <span :class="['status-badge', userType === 'member' ? 'status-member' : 'status-guest']">
            <span class="status-dot"></span>
            {{ userType === 'member' ? '社团成员' : '访客模式' }}
          </span>
          <span v-if="userInfo" class="user-name">{{ userInfo.cn }}</span>
        </a-space>

        <div v-if="userType === 'guest'" class="guest-tip">
          <p class="guest-tip-text">
            当前为访客模式，部分功能受限
          </p>
          <a-button type="primary" size="small" @click="goToLogin" class="guest-login-btn">
            切换为成员登录
          </a-button>
        </div>

        <a-button v-if="userType === 'member'" type="text" @click="logout" class="logout-btn">
          退出登录
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

const membersClickCount = ref(0)
const maxClicksBeforeAdmin = 6

onMounted(() => {
  updateUserStatus()
  const savedCount = localStorage.getItem('membersClickCount')
  if (savedCount) {
    membersClickCount.value = parseInt(savedCount)
  }
})

const handleMembersClick = () => {
  membersClickCount.value++
  localStorage.setItem('membersClickCount', membersClickCount.value.toString())
  if (membersClickCount.value >= maxClicksBeforeAdmin) {
    membersClickCount.value = 0
    localStorage.setItem('membersClickCount', '0')
    router.push('/admin-login')
  } else {
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
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
/* ===========================
   Button base
   =========================== */
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

/* ===========================
   Nav Card
   =========================== */
.nav-card {
  padding: 16px 24px 20px;
  border-radius: 14px;
  position: relative;
  margin-top: 2em;
  transition: all 0.3s ease;
}

.nav-card-dark {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}
.nav-card-light {
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.nav-card-label {
  position: absolute;
  top: -8px;
  left: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 0 8px;
  background: inherit;
  color: var(--text-muted, rgba(150,150,170,0.6));
}

.nav-card-dark .nav-card-label {
  color: rgba(255,255,255,0.25);
}
.nav-card-light .nav-card-label {
  color: rgba(0,0,0,0.2);
}

/* ===========================
   Nav buttons
   =========================== */
.nav-btn {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  overflow: hidden;
}

.nav-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.nav-btn:hover {
  transform: translateY(-2px);
}

.dark-btn.nav-btn:hover {
  background: #2a2a3a !important;
  box-shadow: 0 4px 20px rgba(15, 155, 142, 0.15);
}
.light-btn.nav-btn:hover {
  background: #f0f5ff !important;
  box-shadow: 0 4px 20px rgba(22, 93, 255, 0.12);
}

/* ===========================
   AI Assistant button
   =========================== */
.ai-assistant-btn {
  font-size: 1em !important;
  padding: 0 !important;
  height: auto !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden;
}

.ai-btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
}

.ai-icon {
  font-size: 1.3em;
  line-height: 1;
}

.ai-text {
  font-weight: 600;
  font-size: 1.05em;
}

.ai-arrow {
  font-size: 1.1em;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
}

.ai-assistant-btn:hover .ai-arrow {
  opacity: 1;
  transform: translateX(0);
}

.dark-btn.ai-assistant-btn {
  background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
  border: 1px solid rgba(15, 155, 142, 0.2) !important;
}
.light-btn.ai-assistant-btn {
  background: linear-gradient(135deg, #ffffff, #f0f5ff) !important;
}

.ai-assistant-btn:hover {
  transform: translateY(-3px) scale(1.02);
}

.dark-btn.ai-assistant-btn:hover {
  box-shadow: 0 8px 28px rgba(15, 155, 142, 0.2) !important;
  border-color: rgba(15, 155, 142, 0.4) !important;
}
.light-btn.ai-assistant-btn:hover {
  box-shadow: 0 8px 28px rgba(22, 93, 255, 0.13) !important;
}

/* ===========================
   Member section
   =========================== */
.member-section {
  margin-top: 1em;
  padding: 12px 16px;
  border-radius: 10px;
  animation: memberFadeIn 0.4s ease;
  position: relative;
}

.member-section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
  color: rgba(255,255,255,0.25);
  text-align: center;
}

@keyframes memberFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.member-btn {
  transition: all 0.25s ease !important;
  border-radius: 8px !important;
}

.member-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 155, 142, 0.15);
}

/* ===========================
   User status
   =========================== */
.user-status {
  text-align: center;
  font-size: 0.9em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-member {
  background: rgba(15, 155, 142, 0.1);
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.2);
}

.status-guest {
  background: rgba(230, 168, 23, 0.08);
  color: #e6a817;
  border: 1px solid rgba(230, 168, 23, 0.15);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.status-member .status-dot {
  background: #0f9b8e;
  box-shadow: 0 0 6px rgba(15, 155, 142, 0.5);
}

.status-guest .status-dot {
  background: #e6a817;
  box-shadow: 0 0 6px rgba(230, 168, 23, 0.4);
}

.user-name {
  color: inherit;
  font-weight: 500;
  font-size: 0.95em;
}

/* --- Guest tip --- */
.guest-tip {
  background: linear-gradient(135deg, rgba(230, 168, 23, 0.08), rgba(230, 168, 23, 0.02)) !important;
  border: 1px solid rgba(230, 168, 23, 0.15) !important;
  border-radius: 10px;
  padding: 12px 20px;
  margin-top: 8px;
  backdrop-filter: blur(8px);
}

.guest-tip-text {
  font-size: 0.85em;
  margin: 0 0 10px 0;
  color: #888;
}

.guest-login-btn {
  border-radius: 8px !important;
  font-weight: 500 !important;
}

/* --- Logout --- */
.logout-btn {
  color: rgba(255, 107, 107, 0.6) !important;
  transition: all 0.2s ease !important;
  font-size: 0.85em !important;
}

.logout-btn:hover {
  color: #ff6b6b !important;
  transform: translateY(-1px);
}
</style>
