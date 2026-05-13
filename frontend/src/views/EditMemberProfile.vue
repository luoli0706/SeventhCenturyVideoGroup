<template>
  <div :class="['edit-profile-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回
      </button>
      <span class="nav-title">完善个人主页</span>
      <div class="nav-spacer"></div>
    </nav>

    <main class="page-content">
      <div class="form-card">
        <div class="form-header">
          <div class="form-avatar-edit">
            <div class="avatar-preview-wrap" @click="triggerUpload">
              <div class="avatar-preview" v-if="previewUrl">
                <img :src="previewUrl" alt="avatar" class="preview-img" />
              </div>
              <div class="avatar-preview avatar-placeholder" v-else>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="11" r="5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onFileSelected"
            />
            <span class="avatar-hint">点击上传头像</span>
          </div>
          <h2 class="form-greeting">{{ memberName }}</h2>
        </div>

        <div class="form-body">
          <!-- 个性签名 -->
          <div class="form-group">
            <label class="form-label">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="label-icon">
                <path d="M4 16l2-2 3 3L17 9l-3-3-7 7-3 3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M12 4l4 4" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              个性签名
            </label>
            <div class="form-field">
              <textarea
                v-model="form.signature"
                placeholder="写下你的个性签名..."
                class="form-textarea"
                :maxlength="200"
                rows="3"
                @input="autoResize"
              ></textarea>
              <span class="char-count">{{ form.signature.length }}/200</span>
            </div>
          </div>

          <!-- B站UID -->
          <div class="form-group">
            <label class="form-label">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="label-icon">
                <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="10" cy="11" r="3" stroke="currentColor" stroke-width="1.2"/>
                <path d="M7 5V3h6v2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              B站 UID
            </label>
            <div class="form-field">
              <input
                v-model="form.biliUID"
                type="text"
                placeholder="请输入B站UID"
                class="form-input"
              />
            </div>
          </div>

          <!-- 代表作 -->
          <div class="form-group">
            <label class="form-label">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="label-icon">
                <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5 5.1 17.2l.9-5.5-4-3.9L7.5 7 10 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              代表作BV号
              <span class="label-optional">（可选）</span>
            </label>
            <div class="form-field">
              <input
                v-model="form.representativeWork"
                type="text"
                placeholder="如：BV1xx4y1x7Tp"
                class="form-input"
              />
            </div>
          </div>

          <!-- 其他信息 -->
          <div class="form-group">
            <label class="form-label">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="label-icon">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.2"/>
                <path d="M10 6v4M10 13v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              其他信息
              <span class="label-optional">（可选）</span>
            </label>
            <div class="form-field">
              <textarea
                v-model="form.other"
                placeholder="其他想要展示的信息..."
                class="form-textarea"
                :maxlength="500"
                rows="2"
                @input="autoResize"
              ></textarea>
              <span class="char-count">{{ form.other.length }}/500</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-cancel" @click="goBack">取消</button>
          <button class="btn btn-submit" :disabled="submitting" @click="handleSubmit">
            <svg v-if="submitting" class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4"/>
            </svg>
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../utils/api'
import { auth } from '../utils/auth'

const router = useRouter()
const route = useRoute()
const memberName = ref('')
const isDark = ref(true)
const submitting = ref(false)
const fileInput = ref(null)
const previewUrl = ref(null)
const selectedFile = ref(null)
const fileInputKey = ref(0)

const form = reactive({
  biliUID: '',
  signature: '',
  representativeWork: '',
  other: ''
})

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

function goBack() { router.back() }

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewUrl.value = ev.target.result }
  reader.readAsDataURL(file)
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('biliUID', form.biliUID)
    formData.append('signature', form.signature)
    formData.append('representativeWork', form.representativeWork)
    formData.append('other', form.other)
    if (selectedFile.value) {
      formData.append('avatar', selectedFile.value)
    }

    const res = await api.post(
      `/api/member-profile/${encodeURIComponent(memberName.value)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (res.status === 200 || res.status === 201) {
      router.push(`/member/${encodeURIComponent(memberName.value)}`)
    }
  } catch (e) {
    console.error('提交失败:', e)
    alert('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })

  memberName.value = decodeURIComponent(route.params.name)

  // 权限检查
  if (!auth.isMember()) {
    alert('只有社团成员才能完善个人主页')
    router.push('/home')
    return
  }
  const currentUser = auth.getUserInfo()
  if (!currentUser || !currentUser.cn) {
    alert('获取用户信息失败，请重新登录')
    router.push('/home')
    return
  }
  if (currentUser.cn !== memberName.value) {
    alert('您无权修改该主页')
    router.push('/home')
    return
  }

  // 加载已有数据
  try {
    const res = await api.get(`/api/member-profile/${encodeURIComponent(memberName.value)}`)
    const data = res.data
    form.biliUID = data.BiliUID || ''
    form.signature = data.Signature || ''
    form.representativeWork = data.RepresentativeWork || ''
    form.other = data.Other || ''
    if (data.Avatar) {
      previewUrl.value = `https://7thcv.cn/${data.Avatar}`
    }
  } catch (e) {
    // 新建，保持表单为空
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.edit-profile-page {
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
.nav-spacer { width: 80px; }

/* --- Content --- */
.page-content {
  position: relative; z-index: 1;
  max-width: 520px; margin: 0 auto;
  padding: 100px 24px 60px;
  animation: fadeUp 0.6s ease;
}

/* --- Form card --- */
.form-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}
.form-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 36px 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

/* Avatar edit */
.form-avatar-edit {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.avatar-preview-wrap {
  position: relative;
  width: 88px; height: 88px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}
.avatar-preview {
  width: 100%; height: 100%;
  border-radius: 50%;
  overflow: hidden;
}
.preview-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.avatar-placeholder {
  background: linear-gradient(135deg, rgba(15,155,142,0.1), rgba(230,168,23,0.06));
  border: 1px dashed rgba(15,155,142,0.15);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,155,142,0.25);
}
.avatar-overlay {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: rgba(8,8,26,0.5);
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  color: rgba(255,255,255,0.7);
}
.avatar-preview-wrap:hover .avatar-overlay {
  opacity: 1;
}
.avatar-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.15);
  letter-spacing: 0.5px;
}
.form-greeting {
  font-size: 1.3rem; font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.5));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* --- Form body --- */
.form-body {
  padding: 24px;
  display: flex; flex-direction: column; gap: 20px;
}
.form-group {
  display: flex; flex-direction: column; gap: 8px;
}
.form-label {
  font-size: 12px; font-weight: 600;
  color: rgba(255,255,255,0.25);
  letter-spacing: 1px;
  text-transform: uppercase;
  display: flex; align-items: center; gap: 6px;
}
.label-icon {
  opacity: 0.4;
  flex-shrink: 0;
}
.label-optional {
  font-weight: 400;
  color: rgba(255,255,255,0.12);
  text-transform: none;
  letter-spacing: 0;
}
.form-field {
  position: relative;
}
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
.form-input::placeholder {
  color: rgba(255,255,255,0.08);
}
.form-input:focus {
  border-color: rgba(15,155,142,0.2);
  background: rgba(15,155,142,0.02);
  box-shadow: 0 0 0 3px rgba(15,155,142,0.04);
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
.form-textarea::placeholder {
  color: rgba(255,255,255,0.08);
}
.form-textarea:focus {
  border-color: rgba(15,155,142,0.2);
  background: rgba(15,155,142,0.02);
  box-shadow: 0 0 0 3px rgba(15,155,142,0.04);
}
.char-count {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 10px;
  color: rgba(255,255,255,0.1);
  pointer-events: none;
}

/* --- Actions --- */
.form-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 28px;
  justify-content: center;
}
.btn {
  flex: 1;
  max-width: 160px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-cancel {
  background: none;
  border: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.3);
}
.btn-cancel:hover {
  border-color: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
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
.btn-spinner {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Light mode ========== */
.edit-profile-page.theme-light {
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
.theme-light .nav-title {
  color: rgba(0,0,0,0.15);
}
.theme-light .form-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .form-header {
  border-bottom-color: rgba(0,0,0,0.03);
}
.theme-light .avatar-placeholder {
  background: rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.12);
}
.theme-light .avatar-overlay {
  background: rgba(255,255,255,0.6);
  color: rgba(0,0,0,0.4);
}
.theme-light .avatar-hint { color: rgba(0,0,0,0.15); }
.theme-light .form-greeting {
  background: linear-gradient(135deg, #1d2129, rgba(29,33,41,0.5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.theme-light .form-label { color: rgba(0,0,0,0.2); }
.theme-light .label-icon { opacity: 0.3; }
.theme-light .label-optional { color: rgba(0,0,0,0.1); }
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
.theme-light .char-count { color: rgba(0,0,0,0.08); }
.theme-light .btn-cancel {
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.25);
}
.theme-light .btn-cancel:hover {
  border-color: rgba(0,0,0,0.1);
  color: rgba(0,0,0,0.4);
}
.theme-light .btn-submit {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.15);
}
.theme-light .btn-submit:hover:not(:disabled) {
  background: rgba(15,155,142,0.1);
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .form-body { padding: 20px 16px; }
  .form-actions { padding: 0 16px 24px; flex-direction: column; align-items: center; }
  .btn { max-width: 100%; width: 100%; }
}
</style>
