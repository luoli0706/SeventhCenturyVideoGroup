<template>
  <div :class="['approval-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goHome">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </button>
      <span class="nav-title">注册审批</span>
      <div class="nav-spacer"></div>
    </nav>

    <main class="page-content">
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          :class="['tab-btn', { active: activeTab === t.value }]"
          @click="switchTab(t.value)"
        >
          {{ t.label }}
          <span v-if="counts[t.value]" class="tab-count">{{ counts[t.value] }}</span>
        </button>
      </div>

      <div v-if="loading" class="state-hint">加载中…</div>

      <div v-else-if="!applications.length" class="state-hint">
        {{ activeTab === 'pending' ? '暂无待审核的申请' : '暂无记录' }}
      </div>

      <div v-else class="app-list">
        <div
          v-for="app in applications"
          :key="app.id"
          :class="['app-card', { expanded: expandedId === app.id }]"
        >
          <div class="app-head" @click="toggleExpand(app.id)">
            <div class="app-headline">
              <span class="app-cn">{{ app.cn }}</span>
              <span class="app-meta">{{ app.position || '未填写职位' }} · {{ app.year || '年份未填写' }}年加入 · {{ app.direction || '方向未填写' }}</span>
            </div>
            <div class="app-headline-right">
              <span class="app-time">{{ formatTime(app.created_at) }}</span>
              <span class="app-chevron">›</span>
            </div>
          </div>

          <div v-if="expandedId === app.id" class="app-detail">
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">姓名</span><span class="detail-value">{{ app.cn }}</span></div>
              <div class="detail-item"><span class="detail-label">性别</span><span class="detail-value">{{ app.sex || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">职位</span><span class="detail-value">{{ app.position || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">加入年份</span><span class="detail-value">{{ app.year || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">方向</span><span class="detail-value">{{ app.direction || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">在役状态</span><span class="detail-value">{{ app.status || '—' }}</span></div>
            </div>
            <div class="detail-remark">
              <span class="detail-label">备注</span>
              <p class="detail-value">{{ app.remark || '（无）' }}</p>
            </div>

            <div v-if="app.state !== 'pending'" class="review-result">
              <span class="detail-label">{{ app.state === 'approved' ? '已批准' : '已拒绝' }}</span>
              <p class="detail-value">
                {{ app.reviewed_by ? `由 ${app.reviewed_by} 于 ${formatTime(app.reviewed_at)} 处理` : '' }}
                <template v-if="app.reject_reason"><br>理由：{{ app.reject_reason }}</template>
              </p>
            </div>

            <template v-if="app.state === 'pending'">
              <div v-if="rejectingId === app.id" class="reject-box">
                <textarea
                  v-model="rejectReason"
                  class="reject-input"
                  rows="3"
                  placeholder="请填写拒绝理由（必填，申请人登录时会看到）"
                ></textarea>
                <div class="reject-actions">
                  <button class="btn btn-ghost" @click="cancelReject">取消</button>
                  <button class="btn btn-danger" :disabled="acting || !rejectReason.trim()" @click="confirmReject(app)">
                    {{ acting ? '提交中…' : '确认拒绝' }}
                  </button>
                </div>
              </div>

              <div v-else class="app-actions">
                <button class="btn btn-ghost" :disabled="acting" @click="startReject(app.id)">拒绝</button>
                <button class="btn btn-primary" :disabled="acting" @click="approve(app)">
                  {{ acting ? '处理中…' : '批准' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import { auth } from '../utils/auth'

const router = useRouter()

const tabs = [
  { label: '待审核', value: 'pending' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已批准', value: 'approved' }
]

const isDark = ref(true)
const activeTab = ref('pending')
const applications = ref([])
const counts = reactive({ pending: 0, rejected: 0, approved: 0 })
const loading = ref(false)
const acting = ref(false)
const expandedId = ref(null)
const rejectingId = ref(null)
const rejectReason = ref('')

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

// 管理员身份失效（token 过期/被撤权）时清干净本地状态再回首页
function handleAuthError(error) {
  const status = error.response?.status
  if (status === 401 || status === 403) {
    auth.logout()
    alert('需要管理员权限')
    router.push('/')
    return true
  }
  return false
}

async function fetchApplications() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/applications', {
      params: { state: activeTab.value }
    })
    applications.value = res.data.applications || []
    counts[activeTab.value] = res.data.total || 0
  } catch (error) {
    if (!handleAuthError(error)) {
      alert(error.response?.data?.error || '加载申请列表失败')
      applications.value = []
    }
  } finally {
    loading.value = false
  }
}

async function fetchCounts() {
  // 一次性拿到三个状态的数量，用于标签角标
  try {
    const res = await api.get('/api/admin/applications', { params: { state: 'all' } })
    const all = res.data.applications || []
    counts.pending = all.filter(a => a.state === 'pending').length
    counts.rejected = all.filter(a => a.state === 'rejected').length
    counts.approved = all.filter(a => a.state === 'approved').length
  } catch (error) {
    handleAuthError(error)
  }
}

function switchTab(value) {
  if (activeTab.value === value) return
  activeTab.value = value
  expandedId.value = null
  rejectingId.value = null
  rejectReason.value = ''
  fetchApplications()
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
  rejectingId.value = null
  rejectReason.value = ''
}

function startReject(id) {
  rejectingId.value = id
  rejectReason.value = ''
}

function cancelReject() {
  rejectingId.value = null
  rejectReason.value = ''
}

async function approve(app) {
  if (!window.confirm(`确认批准「${app.cn}」的注册申请？批准后该成员即可登录。`)) return

  acting.value = true
  try {
    await api.post(`/api/admin/applications/${app.id}/approve`)
    alert('已批准，该成员现在可以登录')
    afterAction()
  } catch (error) {
    if (!handleAuthError(error)) {
      alert(error.response?.data?.error || '批准失败')
    }
  } finally {
    acting.value = false
  }
}

async function confirmReject(app) {
  const reason = rejectReason.value.trim()
  if (!reason) return

  acting.value = true
  try {
    await api.post(`/api/admin/applications/${app.id}/reject`, { reason })
    alert('已拒绝该申请，申请人可修改后重新提交')
    afterAction()
  } catch (error) {
    if (!handleAuthError(error)) {
      alert(error.response?.data?.error || '拒绝失败')
    }
  } finally {
    acting.value = false
  }
}

function afterAction() {
  expandedId.value = null
  rejectingId.value = null
  rejectReason.value = ''
  fetchApplications()
  fetchCounts()
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function goHome() {
  router.push('/home')
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })

  fetchApplications()
  fetchCounts()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.approval-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
}

.bg-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.02) 0.5px, transparent 0.5px);
  background-size: 56px 56px;
}

/* ── Nav ── */
.page-nav {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.nav-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.35);
  font-family: inherit; font-size: 13px;
  transition: color 0.3s ease;
}
.nav-back:hover { color: rgba(15,155,142,0.8); }
.nav-title { font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.nav-spacer { width: 56px; }

/* ── Content ── */
.page-content {
  position: relative; z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

/* ── Tabs ── */
.tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.05);
  background: none;
  color: rgba(255,255,255,0.35);
  font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.tab-btn:hover { color: rgba(255,255,255,0.6); }
.tab-btn.active {
  color: rgba(15,155,142,0.9);
  border-color: rgba(15,155,142,0.25);
  background: rgba(15,155,142,0.05);
}
.tab-count {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(230,168,23,0.15);
  color: rgba(230,168,23,0.9);
}

/* ── States ── */
.state-hint {
  padding: 60px 0;
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,0.15);
}

/* ── List ── */
.app-list { display: flex; flex-direction: column; gap: 10px; }

.app-card {
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  background: rgba(255,255,255,0.012);
  transition: border-color 0.3s ease;
}
.app-card:hover { border-color: rgba(255,255,255,0.1); }
.app-card.expanded { border-color: rgba(15,155,142,0.2); }

.app-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
}
.app-headline { display: flex; flex-direction: column; gap: 5px; }
.app-cn { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
.app-meta { font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.3px; }
.app-headline-right { display: flex; align-items: center; gap: 10px; }
.app-time { font-size: 11px; color: rgba(255,255,255,0.18); }
.app-chevron {
  font-size: 18px; color: rgba(255,255,255,0.2);
  transition: transform 0.3s ease;
}
.app-card.expanded .app-chevron { transform: rotate(90deg); }

/* ── Detail ── */
.app-detail {
  padding: 0 18px 18px;
  border-top: 1px solid rgba(255,255,255,0.04);
  animation: fadeIn 0.3s ease;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 24px;
  padding: 18px 0 4px;
}
.detail-item, .detail-remark, .review-result { display: flex; flex-direction: column; gap: 5px; }
.detail-remark, .review-result { padding-top: 14px; }
.detail-label {
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.15);
}
.detail-value { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.6; white-space: pre-wrap; }
.review-result .detail-value { color: rgba(255,255,255,0.4); font-size: 12px; }

/* ── Actions ── */
.app-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding-top: 20px;
}
.btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost {
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
}
.btn-ghost:hover:not(:disabled) { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.8); }
.btn-primary {
  background: rgba(15,155,142,0.12);
  border: 1px solid rgba(15,155,142,0.3);
  color: rgba(15,155,142,0.95);
}
.btn-primary:hover:not(:disabled) { background: rgba(15,155,142,0.2); }
.btn-danger {
  background: rgba(220,80,80,0.1);
  border: 1px solid rgba(220,80,80,0.3);
  color: rgba(230,110,110,0.95);
}
.btn-danger:hover:not(:disabled) { background: rgba(220,80,80,0.18); }

.reject-box { padding-top: 20px; }
.reject-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.85);
  font-family: inherit; font-size: 13px; line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s ease;
}
.reject-input:focus { border-color: rgba(15,155,142,0.3); }
.reject-input::placeholder { color: rgba(255,255,255,0.15); }
.reject-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Light Mode ===== */
.theme-light.approval-page { background: #f2f0ed; color: #1d2129; }
.theme-light .bg-dots { background-image: radial-gradient(rgba(0,0,0,0.015) 0.5px, transparent 0.5px); }
.theme-light .page-nav { border-bottom-color: rgba(0,0,0,0.05); }
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .tab-btn { border-color: rgba(0,0,0,0.06); color: rgba(0,0,0,0.4); }
.theme-light .tab-btn.active { color: rgba(15,155,142,0.9); border-color: rgba(15,155,142,0.3); }
.theme-light .state-hint { color: rgba(0,0,0,0.2); }
.theme-light .app-card { border-color: rgba(0,0,0,0.06); background: rgba(255,255,255,0.5); }
.theme-light .app-cn { color: rgba(0,0,0,0.8); }
.theme-light .app-meta { color: rgba(0,0,0,0.3); }
.theme-light .app-time { color: rgba(0,0,0,0.25); }
.theme-light .app-detail { border-top-color: rgba(0,0,0,0.05); }
.theme-light .detail-label { color: rgba(0,0,0,0.25); }
.theme-light .detail-value { color: rgba(0,0,0,0.7); }
.theme-light .review-result .detail-value { color: rgba(0,0,0,0.45); }
.theme-light .reject-input {
  border-color: rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
  color: rgba(0,0,0,0.8);
}
.theme-light .reject-input::placeholder { color: rgba(0,0,0,0.25); }
.theme-light .btn-ghost { border-color: rgba(0,0,0,0.12); color: rgba(0,0,0,0.5); }

/* ===== Responsive ===== */
@media (max-width: 600px) {
  .page-content { padding: 24px 16px 60px; }
  .detail-grid { grid-template-columns: 1fr; }
  .app-head { padding: 14px; }
  .app-detail { padding: 0 14px 14px; }
}
</style>
