<template>
  <div :class="['login-choice-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>

    <main class="page-content">
      <div class="choice-card">
        <div class="card-brand">
          <div class="brand-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="1.2"/>
              <path d="M12 22l6-12 6 12" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M14 19h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="brand-title">柒世纪视频组</h1>
          <p class="brand-subtitle">MAD / MMD 创作研究社团</p>
        </div>

        <div class="choice-divider">
          <span class="divider-label">请选择您的身份</span>
        </div>

        <div class="choice-grid">
          <button class="choice-card-btn" @click="guestLogin">
            <div class="ccb-icon ccb-icon-guest">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="ccb-title">访客浏览</h3>
            <p class="ccb-desc">浏览基本信息，查看公开内容</p>
            <span class="ccb-action">
              进入首页
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>

          <button class="choice-card-btn" @click="memberLogin">
            <div class="ccb-icon ccb-icon-member">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M18 6l4 4M22 6l-4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="ccb-title">社团成员</h3>
            <p class="ccb-desc">完整功能权限，管理社团事务</p>
            <span class="ccb-action">
              成员登录
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'

const router = useRouter()
const isDark = ref(true)

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

const guestLogin = () => {
  localStorage.setItem('userType', 'guest')
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/home')
}

const memberLogin = () => {
  router.push('/member-login')
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.login-choice-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(15,155,142,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(230,168,23,0.03) 0%, transparent 50%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  color: rgba(255,255,255,0.15);
}

/* --- Content --- */
.page-content {
  position: relative; z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  animation: fadeUp 0.6s ease;
}

/* --- Card --- */
.choice-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  padding: 48px 32px 40px;
}
.card-brand {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 36px;
}
.brand-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,155,142,0.35);
  margin-bottom: 16px;
}
.brand-title {
  font-size: 1.6rem; font-weight: 800;
  margin: 0 0 4px; letter-spacing: 2px;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.5));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.brand-subtitle {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.25);
  margin: 0; letter-spacing: 4px;
}

.choice-divider {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
}
.choice-divider::before {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 1px;
  background: rgba(255,255,255,0.03);
}
.divider-label {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.2);
  letter-spacing: 2px;
  text-transform: uppercase;
  background: rgba(8,8,26,0.9);
  padding: 0 12px;
  position: relative;
}

.choice-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-card-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 24px 24px;
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  text-align: center;
}
.choice-card-btn:hover {
  border-color: rgba(15,155,142,0.1);
  background: rgba(15,155,142,0.02);
  transform: translateY(-2px);
}
.choice-card-btn:active {
  transform: translateY(0);
}

.ccb-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}
.ccb-icon-guest {
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  color: rgba(15,155,142,0.35);
}
.choice-card-btn:hover .ccb-icon-guest {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.15);
  color: #0f9b8e;
}
.ccb-icon-member {
  background: rgba(230,168,23,0.06);
  border: 1px solid rgba(230,168,23,0.08);
  color: rgba(230,168,23,0.35);
}
.choice-card-btn:hover .ccb-icon-member {
  background: rgba(230,168,23,0.08);
  border-color: rgba(230,168,23,0.15);
  color: #e6a817;
}

.ccb-title {
  font-size: 1rem; font-weight: 700;
  margin: 0 0 4px;
  color: rgba(255,255,255,0.7);
  transition: color 0.3s;
}
.choice-card-btn:hover .ccb-title { color: rgba(255,255,255,0.9); }

.ccb-desc {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.25);
  margin: 0 0 16px;
  line-height: 1.5;
}

.ccb-action {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.3);
  transition: all 0.3s ease;
}
.choice-card-btn:first-child:hover .ccb-action { color: #0f9b8e; }
.choice-card-btn:last-child:hover .ccb-action { color: #e6a817; }
.ccb-action svg { transition: transform 0.3s ease; }
.choice-card-btn:hover .ccb-action svg { transform: translateX(4px); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Light mode ========== */
.login-choice-page.theme-light {
  background: #eef0f5;
  color: #1d2129;
}
.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.025) 0.5px, transparent 0.5px);
}
.theme-light .theme-toggle { color: rgba(0,0,0,0.1); }
.theme-light .choice-card {
  background: rgba(255,255,255,0.85);
  border-color: rgba(0,0,0,0.04);
  box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}
.theme-light .brand-title {
  background: linear-gradient(135deg, #1d2129, rgba(29,33,41,0.5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.theme-light .brand-subtitle { color: rgba(0,0,0,0.35); }
.theme-light .divider-label {
  color: rgba(0,0,0,0.2);
  background: rgba(255,255,255,0.85);
}
.theme-light .choice-divider::before { background: rgba(0,0,0,0.06); }
.theme-light .choice-card-btn {
  background: #f5f7fb;
  border-color: rgba(0,0,0,0.06);
}
.theme-light .choice-card-btn:hover {
  border-color: rgba(15,155,142,0.15);
  background: #f5f7fb;
}
.theme-light .ccb-icon-guest {
  background: rgba(15,155,142,0.04);
  border-color: rgba(15,155,142,0.06);
  color: rgba(15,155,142,0.35);
}
.theme-light .choice-card-btn:hover .ccb-icon-guest {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.12);
  color: #0f9b8e;
}
.theme-light .ccb-icon-member {
  background: rgba(230,168,23,0.04);
  border-color: rgba(230,168,23,0.06);
  color: rgba(230,168,23,0.35);
}
.theme-light .choice-card-btn:hover .ccb-icon-member {
  background: rgba(230,168,23,0.06);
  border-color: rgba(230,168,23,0.12);
  color: #e6a817;
}
.theme-light .ccb-title { color: rgba(0,0,0,0.55); }
.theme-light .choice-card-btn:hover .ccb-title { color: rgba(0,0,0,0.75); }
.theme-light .ccb-desc { color: rgba(0,0,0,0.35); }
.theme-light .ccb-action { color: rgba(0,0,0,0.3); }

/* --- Responsive --- */
@media (max-width: 480px) {
  .page-content { padding: 16px; }
  .choice-card { padding: 36px 20px 32px; }
  .brand-title { font-size: 1.3rem; }
  .brand-icon { width: 56px; height: 56px; }
  .brand-icon svg { width: 28px; height: 28px; }
  .choice-card-btn { padding: 24px 16px 20px; }
}
</style>
