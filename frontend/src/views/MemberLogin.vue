<template>
  <div :class="['member-login-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回
      </button>
      <span class="nav-title">成员登录</span>
      <div class="nav-spacer">
        <ThemeSwitcherIcon />
      </div>
    </nav>

    <main class="page-content">
      <div class="form-card">
        <div class="form-header">
          <div class="form-icon-circle">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="4.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <path d="M18 6l4 4M22 6l-4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="form-title">社团成员登录</h2>
          <p class="form-subtitle">请输入您的成员账号和密码</p>
        </div>

        <div class="form-body">
          <!-- 成员姓名 -->
          <div class="form-group">
            <label class="form-label">成员姓名（CN）</label>
            <input
              v-model="form.cn"
              type="text"
              placeholder="请输入您的成员姓名"
              class="form-input"
              :maxlength="20"
            />
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="input-wrap">
              <input
                :type="showPwd ? 'text' : 'password'"
                v-model="form.password"
                placeholder="请输入密码"
                class="form-input"
                @keyup.enter="handleLogin"
              />
              <button class="pwd-toggle" type="button" @click="showPwd = !showPwd">
                <svg v-if="showPwd" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.06 2.94" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 记住密码 -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label" @click="form.rememberMe = !form.rememberMe">
              <span :class="['checkbox-custom', form.rememberMe ? 'checked' : '']">
                <svg v-if="form.rememberMe" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="checkbox-text">记住密码</span>
            </label>
          </div>

          <!-- 登录按钮 -->
          <div class="form-group">
            <button class="submit-btn" :disabled="loading" @click="handleLogin">
              <span v-if="!loading">登录</span>
              <span v-else class="btn-loading">
                <svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/>
                </svg>
                登录中...
              </span>
            </button>
          </div>

          <!-- 链接 -->
          <div class="form-links">
            <button class="link-btn" @click="goToForgotPassword">忘记密码？</button>
            <button class="link-btn" @click="goToChangePassword">修改密码</button>
          </div>
        </div>

        <div class="form-footer">
          <div class="footer-divider">
            <span class="footer-divider-text">或</span>
          </div>
          <button class="outline-btn" @click="goToRegister">注册新账号</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'
const router = useRouter()
const loading = ref(false)
const showPwd = ref(false)
const isDark = ref(true)

const form = reactive({
  cn: '',
  password: '',
  rememberMe: false
})

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })

  const savedCN = localStorage.getItem('savedCN')
  const savedPassword = localStorage.getItem('savedPassword')
  const rememberMe = localStorage.getItem('rememberMe') === 'true'

  if (rememberMe && savedCN && savedPassword) {
    form.cn = savedCN
    form.password = savedPassword
    form.rememberMe = true
  }
})

const handleLogin = async () => {
  if (!form.cn || !form.password) {
    alert('请填写完整的登录信息')
    return
  }

  loading.value = true

  try {
    const response = await api.post('/api/login', {
      cn: form.cn,
      password: form.password
    })

    const { token, cn, is_member } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify({ cn, is_member }))
    localStorage.setItem('userType', 'member')

    if (form.rememberMe) {
      localStorage.setItem('savedCN', form.cn)
      localStorage.setItem('savedPassword', form.password)
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('savedCN')
      localStorage.removeItem('savedPassword')
      localStorage.removeItem('rememberMe')
    }

    alert('登录成功！')
    router.push('/home')
  } catch (error) {
    const errorMsg = error.response?.data?.error || '登录失败，请重试'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

const goToRegister = () => router.push('/register')
const goToForgotPassword = () => router.push('/forgot-password')
const goToChangePassword = () => router.push('/change-password')
const goBack = () => router.push('/')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.member-login-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
}

/* ========== Background ========== */
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

/* ========== Nav ========== */
.page-nav {
  position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
  background: rgba(8,8,26,0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.nav-back {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; color: rgba(255,255,255,0.4);
  font-size: 14px; font-family: inherit; cursor: pointer;
  transition: color 0.2s; padding: 8px 4px;
}
.nav-back:hover { color: rgba(255,255,255,0.65); }
.nav-arrow { font-size: 16px; }
.nav-title {
  font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.35);
  letter-spacing: 1px;
}
.nav-spacer { width: 80px; display: flex; justify-content: flex-end; color: rgba(255,255,255,0.15); }

/* ========== Content ========== */
.page-content {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  margin: 0 auto; padding: 80px 24px 40px;
  animation: fadeUp 0.6s ease;
}

/* ========== Card ========== */
.form-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  padding: 40px 32px;
}
.form-header {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 32px;
}
.form-icon-circle {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(230,168,23,0.06);
  border: 1px solid rgba(230,168,23,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(230,168,23,0.35);
  margin-bottom: 16px;
}
.form-title {
  font-size: 1.4rem; font-weight: 800;
  margin: 0 0 4px; letter-spacing: 1px;
  color: rgba(255,255,255,0.92);
}
.form-subtitle {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.25);
  margin: 0; letter-spacing: 0.5px;
}

/* ========== Form ========== */
.form-body { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
}

/* Input */
.input-wrap { position: relative; }
.form-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 16px;
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  color: rgba(255,255,255,0.75);
  font-size: 14px; font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
}
.form-input:focus {
  border-color: rgba(230,168,23,0.15);
  background: rgba(230,168,23,0.02);
  color: rgba(255,255,255,0.95);
}
.form-input::placeholder { color: rgba(255,255,255,0.06); }
.input-wrap .form-input { padding-right: 44px; }

.pwd-toggle {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: rgba(255,255,255,0.2);
  cursor: pointer; padding: 8px; display: flex;
  transition: color 0.2s;
}
.pwd-toggle:hover { color: rgba(255,255,255,0.45); }

/* Checkbox */
.checkbox-group { padding: 4px 0; }
.checkbox-label {
  display: inline-flex; align-items: center; gap: 8px;
  cursor: pointer; user-select: none;
}
.checkbox-custom {
  width: 18px; height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.015);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.checkbox-custom.checked {
  background: rgba(230,168,23,0.1);
  border-color: rgba(230,168,23,0.2);
  color: #e6a817;
}
.checkbox-text {
  font-size: 13px; color: rgba(255,255,255,0.25);
}

/* Submit Button */
.submit-btn {
  width: 100%; padding: 14px;
  border: none; border-radius: 10px;
  background: rgba(230,168,23,0.06);
  border: 1px solid rgba(230,168,23,0.08);
  color: rgba(230,168,23,0.45);
  font-size: 15px; font-weight: 700; font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
}
.submit-btn:hover:not(:disabled) {
  background: rgba(230,168,23,0.08);
  border-color: rgba(230,168,23,0.15);
  color: #e6a817;
}
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-loading {
  display: inline-flex; align-items: center; gap: 8px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* Links */
.form-links {
  display: flex; justify-content: center;
  gap: 24px; padding: 4px 0;
}
.link-btn {
  background: none; border: none;
  font-size: 13px; font-family: inherit;
  color: rgba(255,255,255,0.25);
  cursor: pointer; padding: 4px;
  transition: color 0.2s;
}
.link-btn:hover { color: #e6a817; }

/* ========== Footer ========== */
.form-footer {
  margin-top: 24px; padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.03);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.footer-divider {
  position: relative; text-align: center; width: 100%;
}
.footer-divider::before {
  content: '';
  position: absolute; top: 50%; left: 0; right: 0;
  height: 1px; background: rgba(255,255,255,0.03);
}
.footer-divider-text {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.08);
  letter-spacing: 2px; text-transform: uppercase;
  background: rgba(8,8,26,0.9);
  padding: 0 12px; position: relative;
}
.outline-btn {
  width: 100%; padding: 12px;
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 10px;
  background: transparent;
  color: rgba(255,255,255,0.2);
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.5px;
}
.outline-btn:hover {
  border-color: rgba(230,168,23,0.1);
  color: #e6a817;
}

/* ========== Animations ========== */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Light Mode ========== */
.member-login-page.theme-light {
  background: #eef0f5;
  color: #1d2129;
}
.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.025) 0.5px, transparent 0.5px);
}
.theme-light .page-nav {
  background: rgba(255,255,255,0.9);
  border-bottom: 1px solid rgba(0,0,0,0.03);
}
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover { color: rgba(0,0,0,0.55); }
.theme-light .nav-title { color: rgba(0,0,0,0.2); }
.theme-light .nav-spacer { color: rgba(0,0,0,0.15); }

.theme-light .form-card {
  background: rgba(255,255,255,0.85);
  border-color: rgba(0,0,0,0.04);
  box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}
.theme-light .form-icon-circle {
  background: rgba(230,168,23,0.04);
  border-color: rgba(230,168,23,0.06);
  color: rgba(230,168,23,0.4);
}
.theme-light .form-title { color: rgba(0,0,0,0.7); }
.theme-light .form-subtitle { color: rgba(0,0,0,0.35); }

.theme-light .form-label { color: rgba(0,0,0,0.3); }
.theme-light .form-input {
  background: rgba(0,0,0,0.01);
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.55);
}
.theme-light .form-input:focus {
  border-color: rgba(230,168,23,0.12);
  background: rgba(230,168,23,0.02);
  color: rgba(0,0,0,0.7);
}
.theme-light .form-input::placeholder { color: rgba(0,0,0,0.12); }
.theme-light .pwd-toggle { color: rgba(0,0,0,0.15); }
.theme-light .pwd-toggle:hover { color: rgba(0,0,0,0.35); }

.theme-light .checkbox-custom {
  border-color: rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.01);
}
.theme-light .checkbox-custom.checked {
  background: rgba(230,168,23,0.06);
  border-color: rgba(230,168,23,0.12);
  color: #e6a817;
}
.theme-light .checkbox-text { color: rgba(0,0,0,0.3); }

.theme-light .submit-btn {
  background: rgba(230,168,23,0.04);
  border-color: rgba(230,168,23,0.06);
  color: rgba(230,168,23,0.4);
}
.theme-light .submit-btn:hover:not(:disabled) {
  background: rgba(230,168,23,0.06);
  border-color: rgba(230,168,23,0.12);
  color: #e6a817;
}
.theme-light .link-btn { color: rgba(0,0,0,0.25); }
.theme-light .link-btn:hover { color: #e6a817; }

.theme-light .form-footer { border-top-color: rgba(0,0,0,0.04); }
.theme-light .footer-divider::before { background: rgba(0,0,0,0.04); }
.theme-light .footer-divider-text {
  color: rgba(0,0,0,0.15);
  background: rgba(255,255,255,0.85);
}
.theme-light .outline-btn {
  border-color: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.25);
}
.theme-light .outline-btn:hover {
  border-color: rgba(230,168,23,0.1);
  color: #e6a817;
}

/* ========== Responsive ========== */
@media (max-width: 480px) {
  .page-content { padding: 72px 16px 32px; }
  .form-card { padding: 32px 20px; }
  .form-title { font-size: 1.2rem; }
}
</style>
