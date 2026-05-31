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

          <!-- 活动图片（选填，可多张） -->
          <div class="form-group">
            <label class="form-label">活动图片 <span class="label-optional">选填</span></label>
            <div class="upload-area" @click="triggerUpload">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp"
                @change="handleFileSelect"
                class="upload-input"
              />
              <div v-if="!uploading && imageUrls.length === 0" class="upload-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M3 17l4-4 3 3 5-5 6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="upload-hint">点击选择多张图片</span>
              </div>
              <div v-else-if="uploading" class="upload-placeholder">
                <svg class="spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="42" stroke-dashoffset="14" stroke-linecap="round"/>
                </svg>
                <span class="upload-hint">上传中...（{{ uploadedCount }}/{{ totalCount }}）</span>
              </div>
              <div v-else class="upload-gallery">
                <div v-for="(url, idx) in imageUrls" :key="idx" class="upload-thumb">
                  <img :src="url" alt="活动图片" class="upload-thumb-img" @error="removeByIndex(idx)" />
                  <button class="upload-remove" @click.stop="removeByIndex(idx)">×</button>
                </div>
                <div class="upload-add-more" @click.stop="triggerUpload">
                  <span class="add-more-icon">+</span>
                </div>
              </div>
            </div>
            <p class="upload-info">支持 JPG、PNG、GIF、WebP，每张最大 20MB，最多 10 张</p>
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
const uploading = ref(false)
const uploadedCount = ref(0)
const totalCount = ref(0)
const isDark = ref(true)
const fileInput = ref(null)
const imageUrls = ref([])

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

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const input = e.target
  const files = Array.from(input.files || [])
  if (!files.length) return

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 20 << 20

  // Validate all files first
  for (const file of files) {
    if (file.size > maxSize) {
      alert(`"${file.name}" 太大，请选择小于 20MB 的图片`)
      input.value = ''
      return
    }
    if (!allowed.includes(file.type)) {
      alert(`"${file.name}" 格式不支持，请选择 JPG、PNG、GIF 或 WebP`)
      input.value = ''
      return
    }
  }

  if (imageUrls.value.length + files.length > 10) {
    alert('最多上传 10 张图片')
    input.value = ''
    return
  }

  uploading.value = true
  uploadedCount.value = 0
  totalCount.value = files.length

  try {
    const fd = new FormData()
    files.forEach(f => fd.append('images', f))
    const res = await api.post('/api/upload/image', fd)
    const urls = res.data.urls || []
    imageUrls.value.push(...urls)
    uploadedCount.value = urls.length
  } catch (e) {
    alert('图片上传失败，请重试')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function removeByIndex(idx) {
  imageUrls.value.splice(idx, 1)
}

async function handleSubmit() {
  if (!form.name || !form.time) {
    alert('请填写活动名称和时间')
    return
  }

  submitting.value = true
  try {
    const payload = { ...form }
    // Store multiple image URLs as JSON array string
    if (imageUrls.value.length > 0) {
      payload.image = JSON.stringify(imageUrls.value)
    }
    await api.post('/api/activities', payload)
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

/* Upload area */
.upload-area {
  position: relative;
  width: 100%; min-height: 120px;
  border-radius: 10px;
  border: 1px dashed rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.008);
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}
.upload-area:hover {
  border-color: rgba(15,155,142,0.1);
  background: rgba(15,155,142,0.01);
}
.upload-input {
  display: none;
}
.upload-placeholder {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; padding: 32px 20px;
  color: rgba(255,255,255,0.08);
}
.upload-hint {
  font-size: 13px; color: rgba(255,255,255,0.15);
}
.upload-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  padding: 12px;
}
.upload-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.03);
  background: rgba(255,255,255,0.005);
}
.upload-thumb-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.upload-remove {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0,0,0,0.5);
  border: none; color: #fff; font-size: 14px;
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: background 0.2s; line-height: 1;
  opacity: 0;
}
.upload-thumb:hover .upload-remove { opacity: 1; }
.upload-remove:hover { background: rgba(0,0,0,0.7); }
.upload-add-more {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px dashed rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.005);
  cursor: pointer;
  transition: all 0.2s ease;
}
.upload-add-more:hover {
  border-color: rgba(15,155,142,0.1);
  background: rgba(15,155,142,0.01);
}
.add-more-icon {
  font-size: 24px; color: rgba(255,255,255,0.04); line-height: 1;
}
.upload-info {
  font-size: 11px; color: rgba(255,255,255,0.08);
  margin: 4px 0 0; padding-left: 2px;
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
.theme-light .upload-area {
  border-color: rgba(0,0,0,0.04);
  background: rgba(0,0,0,0.005);
}
.theme-light .upload-area:hover {
  border-color: rgba(15,155,142,0.08);
}
.theme-light .upload-placeholder { color: rgba(0,0,0,0.06); }
.theme-light .upload-hint { color: rgba(0,0,0,0.1); }
.theme-light .upload-info { color: rgba(0,0,0,0.05); }

/* ========== Responsive ========== */
@media (max-width: 480px) {
  .page-content { padding: 72px 16px 32px; }
  .form-card { padding: 32px 20px; }
  .form-title { font-size: 1.2rem; }
}
</style>
