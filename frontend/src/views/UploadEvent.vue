<template>
  <div :class="['upload-event-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回
      </button>
      <span class="nav-title">上传活动</span>
      <div class="nav-spacer">
        <ThemeSwitcherIcon />
      </div>
    </nav>

    <main class="page-content">
      <div class="form-card">
        <div class="form-header">
          <div class="form-icon-circle">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="6" width="22" height="18" rx="2" stroke="currentColor" stroke-width="1.2"/>
              <path d="M14 10v10M9 15h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="form-title">新建活动</h2>
          <p class="form-subtitle">记录社团的每一次精彩瞬间</p>
        </div>

        <div class="form-body">
          <!-- 活动名称 -->
          <div class="form-group">
            <label class="form-label">活动名称</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入活动名称"
              class="form-input"
            />
          </div>

          <!-- 活动时间 -->
          <div class="form-group">
            <label class="form-label">活动时间</label>
            <input
              v-model="form.time"
              type="date"
              class="form-input"
            />
          </div>

          <!-- 活动详情 -->
          <div class="form-group">
            <label class="form-label">活动详情 <span class="label-optional">选填</span></label>
            <textarea
              v-model="form.detail"
              placeholder="可选，活动详情描述"
              class="form-input form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- 活动图片（选填） -->
          <div class="form-group">
            <label class="form-label">活动图片 <span class="label-optional">选填</span></label>
            <input
              v-model="form.image"
              type="text"
              placeholder="可选，图片 URL 链接"
              class="form-input"
            />
          </div>

          <!-- 提交 -->
          <div class="form-actions">
            <button class="btn-secondary" @click="goBack">取消</button>
            <button class="btn-primary" :disabled="submitting" @click="handleSubmit">
              <span v-if="!submitting">提交活动</span>
              <span v-else class="btn-loading">
                <svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/>
                </svg>
                提交中...
              </span>
            </button>
          </div>
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
const submitting = ref(false)
const isDark = ref(true)

const form = reactive({
  name: '',
  time: '',
  image: '',
  detail: ''
})

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})

function goBack() {
  router.back()
}

async function handleSubmit() {
  if (!form.name || !form.time) {
    alert('请填写活动名称和时间')
    return
  }

  submitting.value = true
  try {
    await api.post('/api/activities', form)
    router.push('/events')
  } catch (e) {
    alert('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.upload-event-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
}

/* --- Background --- */
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(15,155,142,0.05) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 80%, rgba(230,168,23,0.04) 0%, transparent 55%);
}
.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.004) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.004) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* --- Nav --- */
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
  background: none; border: none; color: rgba(255,255,255,0.35);
  font-size: 14px; font-family: inherit; cursor: pointer;
  transition: color 0.2s; padding: 8px 4px;
}
.nav-back:hover { color: rgba(255,255,255,0.6); }
.nav-arrow { font-size: 16px; }
.nav-title {
  font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.35);
  letter-spacing: 1px;
}
.nav-spacer { width: 80px; display: flex; justify-content: flex-end; color: rgba(255,255,255,0.15); }

/* --- Content --- */
.page-content {
  position: relative; z-index: 1;
  width: 100%; max-width: 480px;
  margin: 0 auto; padding: 80px 24px 40px;
  animation: fadeUp 0.6s ease;
}

/* --- Card --- */
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
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,155,142,0.35);
  margin-bottom: 16px;
}
.form-title {
  font-size: 1.4rem; font-weight: 800;
  margin: 0 0 4px; letter-spacing: 1px;
  color: rgba(255,255,255,0.85);
}
.form-subtitle {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.2);
  margin: 0; letter-spacing: 0.5px;
}

/* --- Form --- */
.form-body { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
}
.label-optional {
  text-transform: lowercase;
  color: rgba(255,255,255,0.12);
  font-weight: 400;
}

.form-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 16px;
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  color: rgba(255,255,255,0.65);
  font-size: 14px; font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
}
.form-input:focus {
  border-color: rgba(15,155,142,0.15);
  background: rgba(15,155,142,0.02);
  color: rgba(255,255,255,0.85);
}
.form-input::placeholder { color: rgba(255,255,255,0.06); }

/* Date input */
input[type="date"].form-input {
  color-scheme: dark;
  appearance: none;
  -webkit-appearance: none;
}
input[type="date"].form-input::-webkit-calendar-picker-indicator {
  filter: invert(0.6);
  cursor: pointer;
}

/* Textarea */
.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

/* --- Buttons --- */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.5px;
  text-align: center;
}
.btn-primary {
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  color: rgba(15,155,142,0.35);
}
.btn-primary:hover:not(:disabled) {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.15);
  color: #0f9b8e;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.15);
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.3);
}
.btn-loading {
  display: inline-flex; align-items: center; gap: 8px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* --- Animation --- */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Light Mode ========== */
.upload-event-page.theme-light {
  background: #eef0f5;
  color: #1d2129;
}
.theme-light .bg-grid {
  background-image:
    linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px);
}
.theme-light .page-nav {
  background: rgba(255,255,255,0.9);
  border-bottom-color: rgba(0,0,0,0.03);
}
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover { color: rgba(0,0,0,0.55); }
.theme-light .nav-title { color: rgba(0,0,0,0.25); }
.theme-light .nav-spacer { color: rgba(0,0,0,0.08); }

.theme-light .form-card {
  background: #fff;
  border-color: rgba(0,0,0,0.04);
}
.theme-light .form-icon-circle {
  background: rgba(15,155,142,0.04);
  border-color: rgba(15,155,142,0.06);
  color: rgba(15,155,142,0.3);
}
.theme-light .form-title { color: rgba(0,0,0,0.6); }
.theme-light .form-subtitle { color: rgba(0,0,0,0.12); }

.theme-light .form-label { color: rgba(0,0,0,0.15); }
.theme-light .label-optional { color: rgba(0,0,0,0.08); }
.theme-light .form-input {
  background: rgba(0,0,0,0.01);
  border-color: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.5);
}
.theme-light .form-input:focus {
  border-color: rgba(15,155,142,0.12);
  background: rgba(15,155,142,0.02);
  color: rgba(0,0,0,0.65);
}
.theme-light .form-input::placeholder { color: rgba(0,0,0,0.04); }
.theme-light input[type="date"].form-input::-webkit-calendar-picker-indicator {
  filter: none;
  opacity: 0.3;
}

.theme-light .btn-primary {
  background: rgba(15,155,142,0.04);
  border-color: rgba(15,155,142,0.06);
  color: rgba(15,155,142,0.3);
}
.theme-light .btn-primary:hover:not(:disabled) {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.12);
  color: #0f9b8e;
}
.theme-light .btn-secondary {
  border-color: rgba(0,0,0,0.03);
  color: rgba(0,0,0,0.12);
}
.theme-light .btn-secondary:hover {
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.25);
}

/* ========== Responsive ========== */
@media (max-width: 480px) {
  .page-content { padding: 72px 16px 32px; }
  .form-card { padding: 32px 20px; }
  .form-title { font-size: 1.2rem; }
}
</style>
