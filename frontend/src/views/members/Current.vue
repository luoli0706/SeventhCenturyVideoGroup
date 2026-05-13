<template>
  <div class="current-page">
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
        <h1 class="hero-title">现役成员</h1>
        <p class="hero-desc">当前活跃的在役成员</p>
      </header>

      <div v-if="loading" class="loading-state">
        <a-spin :size="28" />
      </div>

      <div v-else-if="members.length === 0" class="empty-state">
        <span class="empty-icon">👥</span>
        <p>暂无现役成员</p>
      </div>

      <div v-else class="member-grid">
        <router-link
          v-for="m in members"
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
              <span class="mc-tag tag-year">{{ m.Year }}</span>
            </div>
            <p class="mc-remark" v-if="m.Remark">{{ m.Remark }}</p>
          </div>
          <div class="mc-sex">{{ m.Sex === '男' ? '♂' : '♀' }}</div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../utils/api'

const router = useRouter()
const members = ref([])
const loading = ref(true)

function goBack() { router.push('/members') }

onMounted(async () => {
  try {
    const res = await api.get('/api/club_members')
    members.value = (res.data || []).filter(m => m.Status === '仍然在役')
  } catch (e) {
    members.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.current-page {
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
  max-width: 680px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.hero { text-align: center; padding: 40px 0 32px; animation: fadeUp 0.8s ease; }
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

/* --- 成员卡片网格 --- */
.member-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  text-decoration: none;
  transition: all 0.3s ease;
  animation: fadeUp 0.5s ease backwards;
}

.member-card:hover {
  border-color: rgba(15, 155, 142, 0.12);
  background: rgba(15, 155, 142, 0.02);
  transform: translateX(4px);
}

.mc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(15,155,142,0.12), rgba(230,168,23,0.08));
  border: 1px solid rgba(15,155,142,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mc-avatar-text {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(15, 155, 142, 0.6);
}

.mc-body {
  flex: 1;
  min-width: 0;
}

.mc-name {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
}

.mc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.mc-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
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

.tag-year {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.04);
}

.mc-remark {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.25);
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-sex {
  font-size: 1rem;
  color: rgba(255,255,255,0.1);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
}
</style>
