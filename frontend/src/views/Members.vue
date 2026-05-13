<template>
  <div :class="['members-page', isDark ? 'theme-dark' : 'theme-light']">
    <!-- 背景 -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <!-- 导航 -->
    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
    </nav>

    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <h1 class="hero-title">社团成员</h1>
        <p class="hero-desc">柒世纪视频组成员名录</p>
      </header>

      <!-- 合照 -->
      <div class="photo-wrap">
        <div class="photo-frame">
          <img src="/视频组合照2025.png" alt="视频组合照2025" class="group-photo" />
          <div class="photo-shine"></div>
        </div>
        <p class="photo-caption">2025 年社团合照</p>
      </div>

      <!-- 导航卡片 -->
      <div class="nav-cards">
        <router-link to="/members/current" class="nav-card">
          <div class="nav-card-bg"></div>
          <div class="nav-card-content">
            <div class="nav-card-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="12" r="5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 30c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h3 class="nav-card-title">社团现役成员名单</h3>
              <p class="nav-card-desc">当前活跃的在役成员</p>
            </div>
            <span class="nav-card-arrow">→</span>
          </div>
        </router-link>

        <router-link to="/members/all-years" class="nav-card">
          <div class="nav-card-bg"></div>
          <div class="nav-card-content">
            <div class="nav-card-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="6" y="8" width="24" height="22" rx="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 14h24M12 5v4M24 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h3 class="nav-card-title">名人堂</h3>
              <p class="nav-card-desc">过往所有成员名单</p>
            </div>
            <span class="nav-card-arrow">→</span>
          </div>
        </router-link>
      </div>
    </main>

    <!-- 子路由 -->
    <router-view />

    <footer class="page-footer">
      <p>柒世纪视频组 · 成员名录</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const isDark = ref(true)
function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}
onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
function goBack() { router.push('/home') }
</script>

<style scoped>
/* ==============================
   成员名单 — 荣誉·记录·传承
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.members-page {
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
.bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
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

/* --- 主内容 --- */
.page-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  padding: 100px 24px 40px;
}

/* --- Hero --- */
.hero {
  text-align: center;
  padding: 40px 0 32px;
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

/* --- 合照 --- */
.photo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 40px;
}

.photo-frame {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  transition: all 0.4s ease;
}

.photo-frame:hover {
  box-shadow: 0 8px 40px rgba(15, 155, 142, 0.06);
}

.group-photo {
  width: 360px;
  max-width: 90vw;
  display: block;
  transition: transform 0.5s ease;
}

.photo-frame:hover .group-photo {
  transform: scale(1.03);
}

.photo-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
  pointer-events: none;
}

.photo-frame:hover .photo-shine {
  transform: translateX(100%);
}

.photo-caption {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.15);
  margin: 0;
  letter-spacing: 1px;
}

/* --- 导航卡片 --- */
.nav-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-card {
  display: block;
  text-decoration: none;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
}

.nav-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 155, 142, 0.03), transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
}

.nav-card:hover {
  border-color: rgba(15, 155, 142, 0.12);
  transform: translateX(4px);
}

.nav-card:hover .nav-card-bg {
  opacity: 1;
}

.nav-card-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.nav-card-icon {
  flex-shrink: 0;
  color: rgba(15, 155, 142, 0.5);
  transition: color 0.3s ease;
}

.nav-card:hover .nav-card-icon {
  color: #0f9b8e;
}

.nav-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.nav-card-desc {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

.nav-card-arrow {
  margin-left: auto;
  font-size: 1.2rem;
  color: rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}

.nav-card:hover .nav-card-arrow {
  color: #0f9b8e;
  transform: translateX(4px);
}

/* --- Footer --- */
.page-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px 24px;
}
.page-footer p {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.1);
  letter-spacing: 1px;
}

/* ========== Light mode ========== */
.members-page.theme-light {
  background: #f5f7fb;
  color: #1d2129;
}
.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.03) 0.5px, transparent 0.5px);
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
.theme-light .photo-frame {
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.theme-light .photo-frame:hover {
  box-shadow: 0 6px 30px rgba(15,155,142,0.04);
}
.theme-light .photo-caption { color: rgba(0,0,0,0.12); }
.theme-light .nav-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.theme-light .nav-card:hover {
  border-color: rgba(15,155,142,0.15);
  box-shadow: 0 2px 12px rgba(15,155,142,0.04);
}
.theme-light .nav-card-bg {
  background: linear-gradient(135deg, rgba(15,155,142,0.04), transparent);
}
.theme-light .nav-card-title { color: #1d2129; }
.theme-light .nav-card-desc { color: rgba(0,0,0,0.3); }
.theme-light .nav-card-arrow { color: rgba(0,0,0,0.08); }
.theme-light .nav-card-icon { color: rgba(15,155,142,0.4); }
.theme-light .nav-card:hover .nav-card-icon { color: #0f9b8e; }
.theme-light .page-footer p { color: rgba(0,0,0,0.08); }

/* --- Responsive --- */
@media (max-width: 600px) {
  .hero-title { font-size: 1.8rem; }
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 20px; }
}
</style>
