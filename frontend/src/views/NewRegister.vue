<template>
  <div :class="['register-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goToLogin">
        <span class="nav-arrow">←</span> 返回
      </button>
      <span class="nav-title">注册</span>
      <div class="nav-spacer">
        <ThemeSwitcherIcon />
      </div>
    </nav>

    <main class="page-content">
      <div class="form-card" v-if="!registerSuccess">
        <div class="form-header">
          <div class="form-icon-circle">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="4.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <path d="M18 6l4 4M22 6l-4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="form-title">注册社团成员账号</h2>
          <p class="form-subtitle">请填写以下信息创建您的账号</p>
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
                placeholder="请设置密码"
                class="form-input"
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

          <!-- 确认密码 -->
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <div class="input-wrap">
              <input
                :type="showConfirmPwd ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="请再次输入密码"
                class="form-input"
              />
              <button class="pwd-toggle" type="button" @click="showConfirmPwd = !showConfirmPwd">
                <svg v-if="showConfirmPwd" width="16" height="16" viewBox="0 0 24 24" fill="none">
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

          <!-- 性别 -->
          <div class="form-group">
            <label class="form-label">性别</label>
            <div class="option-group">
              <button
                v-for="g in genderOptions"
                :key="g.value"
                :class="['option-btn', form.sex === g.value ? 'active' : '']"
                @click="form.sex = form.sex === g.value ? '' : g.value"
              >
                {{ g.label }}
              </button>
            </div>
          </div>

          <div class="form-row">
            <!-- 职务 -->
            <div class="form-group form-group-half">
              <label class="form-label">职务</label>
              <input
                v-model="form.position"
                type="text"
                placeholder="如：剪辑"
                class="form-input"
              />
            </div>

            <!-- 入学年份 -->
            <div class="form-group form-group-half">
              <label class="form-label">入学年份</label>
              <input
                v-model="form.year"
                type="text"
                placeholder="如：2025"
                class="form-input"
              />
            </div>
          </div>

          <!-- 方向 -->
          <div class="form-group">
            <label class="form-label">方向</label>
            <div class="option-group">
              <button
                v-for="d in directionOptions"
                :key="d"
                :class="['option-btn', form.direction === d ? 'active' : '']"
                @click="form.direction = form.direction === d ? '' : d"
              >
                {{ d }}
              </button>
            </div>
          </div>

          <!-- 在役状态 -->
          <div class="form-group">
            <label class="form-label">在役状态</label>
            <div class="option-group">
              <button
                v-for="s in statusOptions"
                :key="s.value"
                :class="['option-btn', form.status === s.value ? 'active' : '']"
                @click="form.status = form.status === s.value ? '' : s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <!-- 备注 -->
          <div class="form-group">
            <label class="form-label">备注 <span class="label-optional">（可选）</span></label>
            <div class="form-field">
              <textarea
                v-model="form.remark"
                placeholder="其他想补充的信息..."
                class="form-textarea"
                rows="2"
                @input="autoResize"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-submit" :disabled="loading" @click="handleRegister">
            <svg v-if="loading" class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4"/>
            </svg>
            {{ loading ? '注册中...' : '注册账号' }}
          </button>
          <button class="btn btn-outline" @click="goToLogin">
            已有账号？返回登录
          </button>
        </div>
      </div>

      <!-- 注册成功 -->
      <div class="success-card" v-else>
        <div class="success-icon-wrap">
          <div class="success-icon-circle">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M12 20l6 6 10-12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 class="success-title">注册成功！</h2>
        <p class="success-desc">{{ countdown }}秒后自动跳转到登录页面</p>
        <div class="countdown-bar-wrap">
          <div class="countdown-bar" :style="{ width: (countdown / 5) * 100 + '%' }"></div>
        </div>
        <button class="btn btn-submit" @click="goToLogin">立即跳转</button>
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
const isDark = ref(true)
const loading = ref(false)
const registerSuccess = ref(false)
const countdown = ref(5)
const showPwd = ref(false)
const showConfirmPwd = ref(false)

const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
  { label: '其他', value: '其他' },
]

const directionOptions = ['动画', '静止系', '三维']

const statusOptions = [
  { label: '仍然在役', value: '仍然在役' },
  { label: '已退居幕后', value: '已退居幕后' },
]

const form = reactive({
  cn: '',
  password: '',
  confirmPassword: '',
  sex: '',
  position: '',
  year: '',
  direction: '',
  status: '',
  remark: ''
})

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

async function handleRegister() {
  if (!form.cn || !form.password || !form.confirmPassword) {
    alert('请填写完整的注册信息')
    return
  }
  if (!form.status) {
    alert('请选择在役状态')
    return
  }
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    await api.post('/api/register', {
      cn: form.cn,
      password: form.password,
      sex: form.sex,
      position: form.position,
      year: form.year,
      direction: form.direction,
      status: form.status,
      remark: form.remark
    })
    registerSuccess.value = true
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        goToLogin()
      }
    }, 1000)
  } catch (error) {
    const errorMsg = error.response?.data?.error || '注册失败，请重试'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

function goToLogin() {
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

.register-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
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

/* --- Nav --- */
.page-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center;
  padding: 14px 32px;
  background: rgba(8,8,26,0.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.nav-back {
  background: none; border: none;
  color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer;
  padding: 6px 12px; border-radius: 8px;
  transition: all 0.25s ease; font-family: inherit;
  display: flex; align-items: center; gap: 4px;
}
.nav-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.08); }
.nav-arrow { display: inline-block; transition: transform 0.25s ease; }
.nav-back:hover .nav-arrow { transform: translateX(-3px); }
.nav-title {
  flex: 1; text-align: center;
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.2);
  letter-spacing: 2px;
}
.nav-spacer {
  width: 80px;
  display: flex; justify-content: flex-end;
  color: rgba(255,255,255,0.15);
}

/* --- Content --- */
.page-content {
  position: relative; z-index: 1;
  max-width: 480px; margin: 0 auto;
  padding: 100px 24px 60px;
  animation: fadeUp 0.6s ease;
}

/* --- Form Card --- */
.form-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}
.form-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 36px 24px 8px;
}
.form-icon-circle {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,155,142,0.4);
  margin-bottom: 12px;
}
.form-title {
  font-size: 1.3rem; font-weight: 700;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.5));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.form-subtitle {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.15);
  margin: 0;
}

/* --- Form body --- */
.form-body {
  padding: 20px 24px 8px;
  display: flex; flex-direction: column; gap: 16px;
}
.form-group {
  display: flex; flex-direction: column; gap: 6px;
}
.form-row {
  display: flex; gap: 12px;
}
.form-group-half {
  flex: 1;
}
.form-label {
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.label-optional {
  font-weight: 400;
  color: rgba(255,255,255,0.1);
  text-transform: none;
  letter-spacing: 0;
}

/* Inputs */
.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}
.form-input::placeholder { color: rgba(255,255,255,0.08); }
.form-input:focus {
  border-color: rgba(15,155,142,0.2);
  background: rgba(15,155,142,0.02);
  box-shadow: 0 0 0 3px rgba(15,155,142,0.04);
}

/* Password toggle */
.input-wrap {
  position: relative;
}
.input-wrap .form-input {
  padding-right: 40px;
}
.pwd-toggle {
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255,255,255,0.12);
  cursor: pointer;
  padding: 4px;
  display: flex;
  transition: color 0.2s;
}
.pwd-toggle:hover { color: rgba(255,255,255,0.25); }

/* Option buttons (sex, direction, status) */
.option-group {
  display: flex;
  gap: 8px;
}
.option-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
  color: rgba(255,255,255,0.2);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}
.option-btn:hover {
  border-color: rgba(15,155,142,0.1);
  color: rgba(255,255,255,0.3);
}
.option-btn.active {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.15);
  color: #0f9b8e;
}

/* Textarea */
.form-field {
  position: relative;
}
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
  resize: none;
  line-height: 1.6;
  box-sizing: border-box;
}
.form-textarea::placeholder { color: rgba(255,255,255,0.08); }
.form-textarea:focus {
  border-color: rgba(15,155,142,0.2);
  background: rgba(15,155,142,0.02);
  box-shadow: 0 0 0 3px rgba(15,155,142,0.04);
}

/* --- Actions --- */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 24px 28px;
}
.btn {
  width: 100%;
  padding: 11px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-submit {
  background: rgba(15,155,142,0.08);
  border: 1px solid rgba(15,155,142,0.15);
  color: #0f9b8e;
}
.btn-submit:hover:not(:disabled) {
  background: rgba(15,155,142,0.12);
  border-color: rgba(15,155,142,0.25);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline {
  background: none;
  border: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.2);
}
.btn-outline:hover {
  border-color: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
}
.btn-spinner {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Success --- */
.success-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 24px;
  animation: fadeUp 0.6s ease;
}
.success-icon-wrap {
  margin-bottom: 16px;
}
.success-icon-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #0f9b8e;
  animation: successPop 0.6s ease;
}
@keyframes successPop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.success-title {
  font-size: 1.4rem; font-weight: 700;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #0f9b8e, #e6a817);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.success-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.2);
  margin: 0 0 24px;
}
.countdown-bar-wrap {
  width: 200px;
  height: 3px;
  background: rgba(255,255,255,0.04);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 28px;
}
.countdown-bar {
  height: 100%;
  background: linear-gradient(to right, #0f9b8e, #e6a817);
  border-radius: 2px;
  transition: width 1s linear;
}
.success-card .btn-submit {
  max-width: 160px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Light mode ========== */
.register-page.theme-light {
  background: #f5f7fb;
  color: #1d2129;
}
.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.025) 0.5px, transparent 0.5px);
}
.theme-light .page-nav {
  background: rgba(255,255,255,0.9);
  border-bottom-color: rgba(0,0,0,0.06);
}
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover {
  color: #0f9b8e;
  background: rgba(15,155,142,0.06);
}
.theme-light .nav-title { color: rgba(0,0,0,0.15); }
.theme-light .nav-spacer { color: rgba(0,0,0,0.12); }
.theme-light .form-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .form-title {
  background: linear-gradient(135deg, #1d2129, rgba(29,33,41,0.5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.theme-light .form-subtitle { color: rgba(0,0,0,0.12); }
.theme-light .form-label { color: rgba(0,0,0,0.18); }
.theme-light .label-optional { color: rgba(0,0,0,0.08); }
.theme-light .form-input {
  background: #f5f7fb;
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.6);
}
.theme-light .form-input::placeholder { color: rgba(0,0,0,0.08); }
.theme-light .form-input:focus {
  border-color: rgba(15,155,142,0.2);
  background: #fff;
}
.theme-light .pwd-toggle { color: rgba(0,0,0,0.1); }
.theme-light .pwd-toggle:hover { color: rgba(0,0,0,0.2); }
.theme-light .option-btn {
  background: #f5f7fb;
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.2);
}
.theme-light .option-btn:hover {
  border-color: rgba(15,155,142,0.12);
  color: rgba(0,0,0,0.35);
}
.theme-light .option-btn.active {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.2);
  color: #0f9b8e;
}
.theme-light .form-textarea {
  background: #f5f7fb;
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.6);
}
.theme-light .form-textarea::placeholder { color: rgba(0,0,0,0.08); }
.theme-light .form-textarea:focus {
  border-color: rgba(15,155,142,0.2);
  background: #fff;
}
.theme-light .btn-outline {
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.2);
}
.theme-light .btn-outline:hover {
  border-color: rgba(0,0,0,0.1);
  color: rgba(0,0,0,0.35);
}
.theme-light .btn-submit {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.15);
}
.theme-light .btn-submit:hover:not(:disabled) {
  background: rgba(15,155,142,0.1);
}
.theme-light .success-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .success-desc { color: rgba(0,0,0,0.15); }
.theme-light .countdown-bar-wrap { background: rgba(0,0,0,0.04); }

/* --- Responsive --- */
@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .form-body { padding: 16px 16px 4px; gap: 14px; }
  .form-actions { padding: 12px 16px 24px; }
  .form-row { flex-direction: column; gap: 14px; }
  .form-icon-circle { width: 48px; height: 48px; }
  .form-icon-circle svg { width: 24px; height: 24px; }
}
</style>
