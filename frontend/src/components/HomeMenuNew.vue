<template>
  <div class="nav-root">
    <!-- 导航列表 -->
    <div class="nav-list">
      <button class="nav-item" @click="handleMembersClick">
        <span class="nav-text">社团成员名单</span>
        <span class="nav-arrow">→</span>
      </button>
      <router-link to="/events" class="nav-item">
        <span class="nav-text">社团活动事件</span>
        <span class="nav-arrow">→</span>
      </router-link>
      <router-link to="/recruit" class="nav-item">
        <span class="nav-text">社团招新</span>
        <span class="nav-arrow">→</span>
      </router-link>
      <router-link to="/games" class="nav-item">
        <span class="nav-text">奇怪的小游戏</span>
        <span class="nav-arrow">→</span>
      </router-link>
    </div>

    <!-- AI 助手 -->
    <router-link to="/ai-assistant" class="ai-bar">
      <span class="ai-icon">🤖</span>
      <span class="ai-label">视小姬 AI 助手</span>
      <span class="ai-arrow">→</span>
    </router-link>

    <!-- 成员功能 -->
    <div v-if="isMember" class="member-zone">
      <span class="zone-label">成员功能</span>
      <router-link to="/kb-manage" class="member-link">知识库管理</router-link>
    </div>

    <!-- 用户状态 -->
    <div class="status-area">
      <div class="status-badge-row">
        <span :class="['badge', userType === 'member' ? 'badge-member' : 'badge-guest']">
          <span class="badge-dot"></span>
          {{ userType === 'member' ? '社团成员' : '访客' }}
        </span>
        <span v-if="userInfo" class="status-name">{{ userInfo.cn }}</span>
      </div>

      <div v-if="userType === 'guest'" class="guest-hint">
        <span>访客模式 · 部分功能受限</span>
        <button class="hint-btn" @click="goToLogin">成员登录</button>
      </div>

      <button v-if="userType === 'member'" class="logout-link" @click="logout">退出登录</button>
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

function handleMembersClick() {
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

function updateUserStatus() {
  userType.value = auth.getUserType() || 'guest'
  isMember.value = auth.isMember()
  userInfo.value = auth.getUserInfo()
}

function logout() {
  auth.logout()
  router.push('/')
}

function goToLogin() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.nav-root {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ── Nav List ── */
.nav-list {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  text-decoration: none;
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  border-bottom: 1px solid rgba(255,255,255,0.02);
  transition: all 0.35s ease;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.25);
  transition: color 0.35s ease;
}

.nav-arrow {
  font-size: 13px;
  color: rgba(255,255,255,0.04);
  transition: all 0.35s ease;
}

.nav-item:hover .nav-text {
  color: rgba(15,155,142,0.6);
}

.nav-item:hover .nav-arrow {
  color: rgba(15,155,142,0.25);
  transform: translateX(4px);
}

/* ── AI Bar ── */
.ai-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-radius: 12px;
  text-decoration: none;
  background: linear-gradient(135deg, rgba(15,155,142,0.03), rgba(230,168,23,0.01));
  border: 1px solid rgba(15,155,142,0.04);
  transition: all 0.4s ease;
}

.ai-bar:hover {
  background: linear-gradient(135deg, rgba(15,155,142,0.05), rgba(230,168,23,0.02));
  border-color: rgba(15,155,142,0.08);
  box-shadow: 0 4px 20px rgba(15,155,142,0.03);
}

.ai-icon {
  font-size: 1.2em;
  line-height: 1;
}

.ai-label {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.3);
  font-family: 'Maple Mono', inherit;
  transition: color 0.35s ease;
}

.ai-bar:hover .ai-label {
  color: rgba(15,155,142,0.6);
}

.ai-arrow {
  font-size: 14px;
  color: rgba(15,155,142,0.08);
  transition: all 0.35s ease;
}

.ai-bar:hover .ai-arrow {
  color: rgba(15,155,142,0.25);
  transform: translateX(4px);
}

/* ── Member Zone ── */
.member-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0;
  animation: fadeIn 0.4s ease;
}

.zone-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.08);
}

.member-link {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-decoration: none;
  color: rgba(15,155,142,0.3);
  transition: color 0.3s ease;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid rgba(15,155,142,0.04);
}

.member-link:hover {
  color: rgba(15,155,142,0.6);
  border-color: rgba(15,155,142,0.08);
}

/* ── Status Area ── */
.status-area {
  text-align: center;
}

.status-badge-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 4px;
}

.badge-member {
  color: rgba(15,155,142,0.25);
  background: rgba(15,155,142,0.02);
}

.badge-guest {
  color: rgba(230,168,23,0.2);
  background: rgba(230,168,23,0.02);
}

.badge-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.badge-member .badge-dot {
  background: rgba(15,155,142,0.2);
}

.badge-guest .badge-dot {
  background: rgba(230,168,23,0.2);
}

.status-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.08);
}

.guest-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255,255,255,0.08);
}

.hint-btn {
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  color: rgba(230,168,23,0.2);
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(230,168,23,0.04);
  transition: all 0.3s ease;
}

.hint-btn:hover {
  color: rgba(230,168,23,0.35);
  border-color: rgba(230,168,23,0.08);
}

.logout-link {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  color: rgba(255,107,107,0.15);
  padding: 4px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.logout-link:hover {
  color: rgba(255,107,107,0.35);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Light Mode ===== */
.theme-light .nav-item {
  border-bottom-color: rgba(0,0,0,0.02);
}

.theme-light .nav-text {
  color: rgba(0,0,0,0.15);
}

.theme-light .nav-arrow {
  color: rgba(0,0,0,0.02);
}

.theme-light .nav-item:hover .nav-text {
  color: rgba(15,155,142,0.5);
}

.theme-light .nav-item:hover .nav-arrow {
  color: rgba(15,155,142,0.15);
}

.theme-light .ai-bar {
  background: rgba(255,255,255,0.4);
  border-color: rgba(0,0,0,0.02);
}

.theme-light .ai-bar:hover {
  background: rgba(255,255,255,0.6);
  border-color: rgba(15,155,142,0.06);
}

.theme-light .ai-label {
  color: rgba(0,0,0,0.2);
}

.theme-light .ai-bar:hover .ai-label {
  color: rgba(15,155,142,0.5);
}

.theme-light .ai-arrow {
  color: rgba(15,155,142,0.04);
}

.theme-light .ai-bar:hover .ai-arrow {
  color: rgba(15,155,142,0.15);
}

.theme-light .zone-label {
  color: rgba(0,0,0,0.05);
}

.theme-light .member-link {
  color: rgba(15,155,142,0.25);
  border-color: rgba(15,155,142,0.03);
}

.theme-light .member-link:hover {
  color: rgba(15,155,142,0.5);
  border-color: rgba(15,155,142,0.06);
}

.theme-light .badge-member {
  color: rgba(15,155,142,0.2);
  background: rgba(15,155,142,0.01);
}

.theme-light .badge-guest {
  color: rgba(230,168,23,0.15);
  background: rgba(230,168,23,0.01);
}

.theme-light .status-name {
  color: rgba(0,0,0,0.06);
}

.theme-light .guest-hint {
  color: rgba(0,0,0,0.06);
}

.theme-light .hint-btn {
  color: rgba(230,168,23,0.15);
  border-color: rgba(230,168,23,0.03);
}

.theme-light .hint-btn:hover {
  color: rgba(230,168,23,0.3);
  border-color: rgba(230,168,23,0.06);
}

.theme-light .logout-link {
  color: rgba(255,107,107,0.12);
}

.theme-light .logout-link:hover {
  color: rgba(255,107,107,0.3);
}
</style>
