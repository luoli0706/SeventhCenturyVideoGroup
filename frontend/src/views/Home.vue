<template>
  <div :class="['home-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <div class="christmas-link">
      <a href="http://7thcv.cn:1225/" target="_blank" rel="noopener noreferrer" title="访问特别页面">🎄</a>
    </div>

    <main class="page-content">
      <div class="content-flow">
        <div class="section-top">
          <ThemeSwitcher />
        </div>

        <Title />

        <div class="dept-strip">
          <router-link v-for="d in departments" :key="d.to" :to="d.to" class="dept-chip">{{ d.label }}</router-link>
        </div>

        <div class="section-search">
          <SearchBox />
        </div>

        <div class="section-nav">
          <span class="nav-label">导航</span>
          <HomeMenu :is-dark="isDark" />
        </div>
      </div>
    </main>

    <footer class="page-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">闽ICP备2025101374号</a>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Title from '../components/Title.vue'
import SearchBox from '../components/SearchBox.vue'
import HomeMenu from '../components/HomeMenuNew.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'

const isDark = ref(true)

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})

const departments = [
  { label: '动画系', to: '/animation' },
  { label: '静止系', to: '/static' },
  { label: '三维', to: '/3d' }
]
</script>

<style scoped>
/* ── Background Layer ── */
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 600px 400px at 30% 20%, rgba(15,155,142,0.03) 0%, transparent 100%),
    radial-gradient(ellipse 500px 500px at 70% 80%, rgba(230,168,23,0.02) 0%, transparent 100%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.004) 0.5px, transparent 0.5px);
  background-size: 56px 56px;
}

.home-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Christmas Link ── */
.christmas-link {
  position: fixed;
  top: 24px;
  right: 28px;
  z-index: 100;
  opacity: 0.5;
  transition: opacity 0.4s ease;
}
.christmas-link:hover { opacity: 1; }
.christmas-link a {
  display: inline-block;
  font-size: 22px;
  text-decoration: none;
  transition: transform 0.3s ease;
}
.christmas-link a:hover { transform: scale(1.2) rotate(8deg); }

/* ── Content ── */
.page-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 20vh 24px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-flow {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-flow > * {
  animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
}
.content-flow > *:nth-child(1) { animation-delay: 0s; }
.content-flow > *:nth-child(2) { animation-delay: 0.1s; }
.content-flow > *:nth-child(3) { animation-delay: 0.2s; }
.content-flow > *:nth-child(4) { animation-delay: 0.3s; }
.content-flow > *:nth-child(5) { animation-delay: 0.4s; }

/* ── Sections ── */
.section-top {
  margin-bottom: 48px;
  opacity: 0.3;
  transition: opacity 0.4s ease;
}
.section-top:hover { opacity: 0.6; }

.dept-strip {
  display: flex;
  gap: 12px;
  margin-top: 36px;
  margin-bottom: 36px;
}

.dept-chip {
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-decoration: none;
  transition: all 0.35s ease;
  color: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.02);
}

.dept-chip:hover {
  color: rgba(15,155,142,0.5);
  border-color: rgba(15,155,142,0.06);
}

.section-search {
  width: 100%;
  margin-bottom: 40px;
}

.section-nav {
  width: 100%;
}

.nav-label {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.04);
  margin-bottom: 24px;
}

/* ── Footer ── */
.page-footer {
  position: relative;
  z-index: 1;
  padding: 0 24px 20px;
  font-size: 10px;
  letter-spacing: 1px;
  margin-top: auto;
}
.page-footer a {
  color: rgba(255,255,255,0.04);
  text-decoration: none;
  transition: color 0.3s ease;
}
.page-footer a:hover { color: rgba(255,255,255,0.1); }

/* ── Animations ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Light Mode ===== */
.theme-light.home-page {
  background: #f2f0ed;
  color: #1d2129;
}

.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.008) 0.5px, transparent 0.5px);
}

.theme-light .dept-chip {
  color: rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.02);
}

.theme-light .dept-chip:hover {
  color: rgba(15,155,142,0.4);
  border-color: rgba(15,155,142,0.06);
}

.theme-light .nav-label {
  color: rgba(0,0,0,0.03);
}

.theme-light .page-footer a {
  color: rgba(0,0,0,0.04);
}

.theme-light .page-footer a:hover {
  color: rgba(0,0,0,0.12);
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .page-content {
    padding: 14vh 20px 60px;
  }
  .section-top { margin-bottom: 36px; }
  .dept-strip { gap: 8px; margin-top: 28px; margin-bottom: 28px; }
  .section-search { margin-bottom: 32px; }
}
</style>
