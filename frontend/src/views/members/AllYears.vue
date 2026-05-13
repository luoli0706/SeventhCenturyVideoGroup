<template>
  <div class="all-years-page">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回成员名单
      </button>
      <span class="nav-count" v-if="members.length">{{ members.length }} 人</span>
    </nav>

    <main class="page-content">
      <header class="hero">
        <h1 class="hero-title">名人堂</h1>
        <p class="hero-desc">过往所有成员名单</p>
      </header>

      <div v-if="loading" class="loading-state">
        <a-spin :size="28" />
      </div>

      <div v-else-if="members.length === 0" class="empty-state">
        <span class="empty-icon">🏛️</span>
        <p>暂无成员记录</p>
      </div>

      <!-- Year groups -->
      <div v-else class="year-groups">
        <div
          v-for="(group, year) in groupedByYear"
          :key="year"
          class="year-group"
        >
          <div class="year-divider">
            <span class="year-label">{{ year }}</span>
            <span class="year-line"></span>
            <span class="year-count">{{ group.length }} 人</span>
          </div>

          <div class="member-grid">
            <router-link
              v-for="m in group"
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
                  <span class="mc-tag tag-sex">{{ m.Sex === '男' ? '♂' : '♀' }}</span>
                </div>
                <p class="mc-remark" v-if="m.Remark">{{ m.Remark }}</p>
              </div>
              <div class="mc-arrow">→</div>
            </router-link>
          </div>
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

function goBack() { router.push('/members') }

const groupedByYear = computed(() => {
  const groups = {}
  for (const m of members.value) {
    const y = m.Year || '未知'
    if (!groups[y]) groups[y] = []
    groups[y].push(m)
  }
  // sort years descending
  const sorted = {}
  Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(k => { sorted[k] = groups[k] })
  return sorted
})

onMounted(async () => {
  try {
    const res = await api.get('/api/club_members')
    members.value = res.data || []
  } catch (e) {
    members.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.all-years-page {
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
.nav-count { font-size: 12px; color: rgba(255,255,255,0.2); letter-spacing: 1px; }

.page-content {
  position: relative; z-index: 1;
  max-width: 720px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.hero { text-align: center; padding: 40px 0 32px; animation: fadeUp 0.8s ease; }
.hero-title {
  font-size: 2rem; font-weight: 800; letter-spacing: 3px;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #e6a817, #0f9b8e);
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

/* --- Year divider --- */
.year-groups {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.year-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  animation: fadeUp 0.6s ease;
}
.year-label {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, rgba(230,168,23,0.8), rgba(230,168,23,0.3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
}
.year-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(230,168,23,0.2), transparent);
}
.year-count {
  font-size: 11px;
  color: rgba(255,255,255,0.15);
  letter-spacing: 1px;
  flex-shrink: 0;
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
  animation: fadeUp 0.5s ease backwards;
}
.member-card:hover {
  border-color: rgba(230, 168, 23, 0.12);
  background: rgba(230, 168, 23, 0.02);
  transform: translateX(4px);
}

.mc-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(230,168,23,0.12), rgba(15,155,142,0.08));
  border: 1px solid rgba(230,168,23,0.1);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mc-avatar-text {
  font-size: 0.95rem; font-weight: 700;
  color: rgba(230, 168, 23, 0.5);
}
.mc-body { flex: 1; min-width: 0; }
.mc-name {
  font-size: 0.95rem; font-weight: 600;
  color: #fff; margin: 0 0 5px;
}
.mc-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 3px; }
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
.tag-sex {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.04);
}
.mc-remark {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.2);
  margin: 3px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mc-arrow {
  font-size: 1rem;
  color: rgba(255,255,255,0.08);
  flex-shrink: 0;
  transition: all 0.3s ease;
}
.member-card:hover .mc-arrow {
  color: #e6a817;
  transform: translateX(4px);
}

@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .year-label { font-size: 1.3rem; }
}
</style>
