<template>
  <div :class="['events-page', isDark ? 'theme-dark' : 'theme-light']">
    <!-- 背景 -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
    </div>

    <!-- 导航 -->
    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回
      </button>
      <div class="nav-actions">
        <a-select v-model="sortType" :style="{ width: '140px' }" size="small" class="sort-select">
          <a-option value="time">按时间排序</a-option>
          <a-option value="name">按名称排序</a-option>
        </a-select>
        <router-link to="/events/upload">
          <a-button type="primary" size="small" class="upload-btn">
            <icon-plus /> 上传活动
          </a-button>
        </router-link>
      </div>
    </nav>

    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <h1 class="hero-title">社团活动事件</h1>
        <p class="hero-desc" v-if="events.length">共 {{ events.length }} 个活动</p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <a-spin :size="32" />
      </div>

      <!-- Empty -->
      <div v-else-if="events.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无活动记录</p>
        <router-link to="/events/upload">
          <a-button type="primary">上传第一个活动</a-button>
        </router-link>
      </div>

      <!-- Timeline -->
      <div v-else class="timeline">
        <div class="tl-line"></div>
        <div
          v-for="(event, i) in sortedEvents"
          :key="event.ID"
          class="tl-item"
          :style="{ '--tl-i': i }"
        >
          <!-- 日期标记 -->
          <div class="tl-dot-wrap">
            <div class="tl-dot">
              <div class="tl-dot-inner"></div>
            </div>
          </div>

          <!-- 卡片 -->
          <div class="tl-card">
            <div class="tl-card-glow"></div>
            <div class="tl-date">
              <span class="tl-date-num">{{ formatDay(event.Time) }}</span>
              <span class="tl-date-month">{{ formatMonthYear(event.Time) }}</span>
            </div>
            <div class="tl-body">
              <h3 class="tl-title">{{ event.Name }}</h3>
              <p class="tl-content">{{ event.Content }}</p>
              <div class="tl-footer">
                <span class="tl-timeago">{{ timeAgo(event.Time) }}</span>
                <router-link v-if="event.Detail" :to="`/events/${event.ID}`" class="tl-detail-link">
                  查看详情 →
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="page-footer">
      <p>柒世纪视频组 · 活动记录</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()
function goBack() { router.back() }

const sortType = ref('time')
const events = ref([])
const loading = ref(true)
const isDark = ref(true)

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

const sortedEvents = computed(() => {
  const list = [...events.value]
  if (sortType.value === 'name') {
    return list.sort((a, b) => a.Name.localeCompare(b.Name, 'zh-CN'))
  }
  return list.sort((a, b) => b.Time.localeCompare(a.Time))
})

function formatDay(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts[2] || dateStr
}

function formatMonthYear(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
  return dateStr
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / 86400000)
  if (days < 1) return '今天'
  if (days < 30) return `${days} 天前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}

onMounted(async () => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
  try {
    const res = await api.get('/api/activities')
    events.value = res.data || []
  } catch (e) {
    events.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ==============================
   活动事件 — 时间线·记录·叙事
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

.events-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* --- 背景 --- */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(15, 155, 142, 0.05) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 80%, rgba(230, 168, 23, 0.04) 0%, transparent 55%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.004) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.004) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* --- 导航 --- */
.page-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  background: rgba(8, 8, 26, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.nav-back {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s ease;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-back:hover {
  color: #0f9b8e;
  background: rgba(15, 155, 142, 0.08);
}
.nav-arrow { display: inline-block; transition: transform 0.25s ease; }
.nav-back:hover .nav-arrow { transform: translateX(-3px); }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select :deep(.arco-select-view) {
  background: rgba(255,255,255,0.03) !important;
  border-color: rgba(255,255,255,0.06) !important;
  color: rgba(255,255,255,0.6) !important;
  border-radius: 8px !important;
  font-size: 12px !important;
}

.sort-select :deep(.arco-select-view:hover) {
  border-color: rgba(15, 155, 142, 0.2) !important;
}

.upload-btn {
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
}

/* --- 主内容 --- */
.page-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 100px 24px 40px;
}

/* --- Hero --- */
.hero {
  text-align: center;
  padding: 60px 0 40px;
  animation: fadeUp 0.8s ease;
}

.hero-title {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #0f9b8e, #e6a817);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.25);
  margin: 0;
  letter-spacing: 2px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Loading / Empty --- */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
}

.empty-icon { font-size: 3rem; }
.empty-text { font-size: 1rem; color: rgba(255,255,255,0.3); margin: 0; }

/* --- Timeline --- */
.timeline {
  position: relative;
  padding: 10px 0;
}

.tl-line {
  position: absolute;
  left: 32px;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: linear-gradient(to bottom, rgba(15, 155, 142, 0.2), rgba(15, 155, 142, 0.05), transparent);
}

.tl-item {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--tl-i) * 0.08s);
}

/* --- 圆点 --- */
.tl-dot-wrap {
  position: relative;
  width: 64px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

.tl-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(15, 155, 142, 0.08);
  border: 2px solid rgba(15, 155, 142, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1;
}

.tl-dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0f9b8e;
  transition: all 0.3s ease;
}

.tl-item:hover .tl-dot {
  border-color: #0f9b8e;
  background: rgba(15, 155, 142, 0.15);
  box-shadow: 0 0 20px rgba(15, 155, 142, 0.15);
  transform: scale(1.1);
}

.tl-item:hover .tl-dot-inner {
  background: #e6a817;
  box-shadow: 0 0 10px rgba(230, 168, 23, 0.3);
}

/* --- 卡片 --- */
.tl-card {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 20px 20px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
}

.tl-card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(15, 155, 142, 0.02) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.tl-card:hover {
  border-color: rgba(15, 155, 142, 0.1);
  background: rgba(15, 155, 142, 0.02);
  transform: translateX(4px);
}

.tl-card:hover .tl-card-glow {
  opacity: 1;
}

/* --- 日期 --- */
.tl-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 56px;
  flex-shrink: 0;
}

.tl-date-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: rgba(15, 155, 142, 0.6);
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.1;
}

.tl-date-month {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.2);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.5px;
}

/* --- 正文 --- */
.tl-body {
  flex: 1;
  min-width: 0;
}

.tl-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: #fff;
}

.tl-content {
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.4);
  margin: 0 0 10px;
}

.tl-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tl-timeago {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.15);
  font-family: 'JetBrains Mono', monospace;
}

.tl-detail-link {
  font-size: 0.8rem;
  color: #0f9b8e;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tl-detail-link:hover {
  color: #e6a817;
}

/* --- Footer --- */
.page-footer {
  text-align: center;
  padding: 40px 24px;
  margin-top: 40px;
}

.page-footer p {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.1);
  letter-spacing: 1px;
}

/* ========== Light mode ========== */
.events-page.theme-light {
  background: #f5f7fb;
  color: #1d2129;
}
.theme-light .bg-grid {
  background-image:
    linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px);
  background-size: 60px 60px;
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
.theme-light .hero-desc { color: rgba(0,0,0,0.2); }
.theme-light .tl-line {
  background: linear-gradient(to bottom, rgba(15,155,142,0.15), rgba(15,155,142,0.03), transparent);
}
.theme-light .tl-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .tl-card:hover {
  border-color: rgba(15,155,142,0.12);
  background: rgba(15,155,142,0.015);
}
.theme-light .tl-title { color: #1d2129; }
.theme-light .tl-content { color: rgba(0,0,0,0.4); }
.theme-light .tl-timeago { color: rgba(0,0,0,0.12); }
.theme-light .tl-date-num { color: rgba(15,155,142,0.5); }
.theme-light .tl-date-month { color: rgba(0,0,0,0.12); }
.theme-light .page-footer p { color: rgba(0,0,0,0.08); }
.theme-light .empty-text { color: rgba(0,0,0,0.2); }
.theme-light .sort-select :deep(.arco-select-view) {
  background: rgba(0,0,0,0.02) !important;
  border-color: rgba(0,0,0,0.06) !important;
  color: rgba(0,0,0,0.4) !important;
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .hero-title { font-size: 1.8rem; }
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 20px; }
  .tl-dot-wrap { width: 44px; }
  .tl-card { flex-direction: column; gap: 8px; }
  .tl-date { flex-direction: row; gap: 6px; }
  .tl-date-num { font-size: 1.2rem; }
}
</style>
