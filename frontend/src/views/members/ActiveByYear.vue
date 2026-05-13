<template>
  <div :class="['active-by-year-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回成员名单
      </button>
    </nav>

    <main class="page-content">
      <header class="hero">
        <h1 class="hero-title">年度在役成员</h1>
        <p class="hero-desc">按年份浏览活跃阵容</p>
      </header>

      <!-- Year selector -->
      <div class="year-selector">
        <button
          v-for="y in availableYears"
          :key="y"
          class="year-chip"
          :class="{ active: selectedYear === y }"
          @click="selectYear(y)"
        >
          {{ y }} 年
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <a-spin :size="28" />
      </div>

      <div v-else-if="filteredMembers.length === 0" class="empty-state">
        <span class="empty-icon">📅</span>
        <p>{{ selectedYear ? `${selectedYear} 年暂无在役成员` : '请选择年份' }}</p>
      </div>

      <div v-else class="result-section">
        <div class="result-header">
          <span class="result-year">{{ selectedYear }}</span>
          <span class="result-count">{{ filteredMembers.length }} 人在役</span>
        </div>
        <div class="member-grid">
          <router-link
            v-for="m in filteredMembers"
            :key="m.ID"
            :to="`/member/${encodeURIComponent(m.CN)}`"
            class="member-card"
          >
            <div class="mc-avatar">
              <span class="mc-avatar-text">{{ m.CN[0] }}</span>
            </div>
            <div class="mc-body">
              <h3 class="mc-name">{{ m.CN }}</h3>
              <div class="mc-tags">
                <span class="mc-tag tag-direction">{{ m.Direction }}</span>
                <span class="mc-tag tag-position">{{ m.Position }}</span>
              </div>
            </div>
            <div class="mc-status" :class="m.Status === '仍然在役' ? 'status-active' : 'status-inactive'">
              {{ m.Status === '仍然在役' ? '在役' : '已离队' }}
            </div>
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../utils/api'

const router = useRouter()
const members = ref([])
const loading = ref(true)
const selectedYear = ref('')
const isDark = ref(true)

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

function goBack() { router.push('/members') }

const availableYears = computed(() => {
  const years = new Set()
  for (const m of members.value) {
    if (m.Year) years.add(m.Year)
  }
  return [...years].sort((a, b) => b.localeCompare(a))
})

const filteredMembers = computed(() => {
  if (!selectedYear.value) return []
  return members.value.filter(m => m.Year === selectedYear.value)
})

function selectYear(y) {
  selectedYear.value = y
}

onMounted(async () => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
  try {
    const res = await api.get('/api/club_members')
    members.value = res.data || []
    if (availableYears.value.length > 0) {
      selectedYear.value = availableYears.value[0]
    }
  } catch (e) {
    members.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.active-by-year-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
}
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(15,155,142,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(230,168,23,0.03) 0%, transparent 50%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

.page-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
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

.page-content {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.hero { text-align: center; padding: 40px 0 28px; animation: fadeUp 0.8s ease; }
.hero-title {
  font-size: 2rem; font-weight: 800; letter-spacing: 3px;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #0f9b8e, #e6a817);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-desc { font-size: 0.85rem; color: rgba(255,255,255,0.2); margin: 0; letter-spacing: 2px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px; gap: 12px;
}
.empty-icon { font-size: 2.4rem; }
.empty-state p { font-size: 0.95rem; color: rgba(255,255,255,0.3); margin: 0; }

/* --- Year selector --- */
.year-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 36px;
  animation: fadeUp 0.6s ease 0.2s backwards;
}
.year-chip {
  padding: 10px 24px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.4);
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
}
.year-chip:hover {
  border-color: rgba(15, 155, 142, 0.15);
  color: rgba(255,255,255,0.6);
  background: rgba(15, 155, 142, 0.04);
}
.year-chip.active {
  border-color: #0f9b8e;
  color: #0f9b8e;
  background: rgba(15, 155, 142, 0.08);
  box-shadow: 0 0 20px rgba(15, 155, 142, 0.06);
}

/* --- Result section --- */
.result-section {
  animation: fadeUp 0.5s ease;
}
.result-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.result-year {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #0f9b8e, rgba(15,155,142,0.4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.result-count {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1px;
}

/* --- Member cards --- */
.member-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  text-decoration: none;
  transition: all 0.3s ease;
  animation: fadeUp 0.4s ease backwards;
}
.member-card:hover {
  border-color: rgba(15, 155, 142, 0.12);
  background: rgba(15, 155, 142, 0.02);
  transform: translateX(4px);
}

.mc-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(15,155,142,0.12), rgba(230,168,23,0.08));
  border: 1px solid rgba(15,155,142,0.1);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mc-avatar-text {
  font-size: 0.95rem; font-weight: 700;
  color: rgba(15, 155, 142, 0.5);
}
.mc-body { flex: 1; min-width: 0; }
.mc-name {
  font-size: 0.95rem; font-weight: 600;
  color: #fff; margin: 0 0 5px;
}
.mc-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.mc-tag {
  font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 4px;
  letter-spacing: 0.5px;
}
.tag-direction {
  background: rgba(15, 155, 142, 0.08);
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.1);
}
.tag-position {
  background: rgba(230, 168, 23, 0.06);
  color: #e6a817;
  border: 1px solid rgba(230, 168, 23, 0.08);
}
.mc-status {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 100px;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.status-active {
  background: rgba(15, 155, 142, 0.08);
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.1);
}
.status-inactive {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.04);
}

/* ========== Light mode ========== */
.active-by-year-page.theme-light {
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
.theme-light .hero-desc { color: rgba(0,0,0,0.2); }
.theme-light .year-chip {
  border-color: rgba(0,0,0,0.06);
  background: rgba(0,0,0,0.02);
  color: rgba(0,0,0,0.3);
}
.theme-light .year-chip:hover {
  border-color: rgba(15,155,142,0.2);
  color: rgba(0,0,0,0.5);
  background: rgba(15,155,142,0.03);
}
.theme-light .member-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .member-card:hover {
  border-color: rgba(15,155,142,0.15);
  background: rgba(15,155,142,0.02);
}
.theme-light .mc-name { color: #1d2129; }
.theme-light .mc-avatar {
  background: linear-gradient(135deg, rgba(15,155,142,0.08), rgba(230,168,23,0.05));
  border-color: rgba(15,155,142,0.08);
}
.theme-light .mc-avatar-text { color: rgba(15,155,142,0.5); }
.theme-light .result-header { border-bottom-color: rgba(0,0,0,0.04); }
.theme-light .result-count { color: rgba(0,0,0,0.15); }
.theme-light .status-inactive {
  background: rgba(0,0,0,0.03);
  color: rgba(0,0,0,0.2);
  border-color: rgba(0,0,0,0.04);
}
.theme-light .empty-state p { color: rgba(0,0,0,0.2); }

@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .year-chip { padding: 8px 18px; font-size: 0.82rem; }
  .result-year { font-size: 1.4rem; }
}
</style>
