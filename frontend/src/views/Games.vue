<template>
  <div :class="['games-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
    </nav>

    <main class="page-content">
      <template v-if="!playing">
        <header class="hero">
          <h1 class="hero-title">奇怪的小游戏</h1>
          <p class="hero-desc">一些有趣的小玩意</p>
        </header>

        <div class="game-list">
          <div class="game-card" @click="playGame('合成大西瓜')">
            <div class="gc-icon">🍉</div>
            <div class="gc-body">
              <h3 class="gc-title">合成大西瓜</h3>
              <p class="gc-desc">经典合成大西瓜小游戏</p>
            </div>
            <span class="gc-play">进入 →</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="game-player">
          <div class="gp-header">
            <button class="gp-back" @click="exitGame">
              <span>←</span> 返回游戏列表
            </button>
            <span class="gp-title">{{ currentGame }}</span>
          </div>
          <div class="gp-frame-wrap">
            <iframe
              :src="gameSrc"
              class="gp-frame"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const playing = ref(false)
const currentGame = ref('')
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
function playGame(name) {
  currentGame.value = name
  playing.value = true
}
function exitGame() {
  playing.value = false
  currentGame.value = ''
}

const gameSrc = computed(() => {
  if (currentGame.value === '合成大西瓜') return '/小游戏/合成大西瓜/index.html'
  return ''
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.games-page {
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
  background: radial-gradient(ellipse at 30% 20%, rgba(230,168,23,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(15,155,142,0.03) 0%, transparent 50%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

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

.page-content {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.hero { text-align: center; padding: 50px 0 40px; animation: fadeUp 0.8s ease; }
.hero-title {
  font-size: 2.2rem; font-weight: 800; letter-spacing: 4px;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #e6a817, #0f9b8e);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-desc { font-size: 0.85rem; color: rgba(255,255,255,0.2); margin: 0; letter-spacing: 2px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Game list --- */
.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeUp 0.6s ease 0.15s backwards;
}
.game-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  cursor: pointer;
  transition: all 0.3s ease;
}
.game-card:hover {
  border-color: rgba(15,155,142,0.15);
  background: rgba(15,155,142,0.02);
  transform: translateX(4px);
}
.gc-icon { font-size: 2.2rem; flex-shrink: 0; }
.gc-body { flex: 1; min-width: 0; }
.gc-title {
  font-size: 1.1rem; font-weight: 600;
  color: #fff; margin: 0 0 4px;
}
.gc-desc {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.25);
  margin: 0;
}
.gc-play {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(15,155,142,0.5);
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.game-card:hover .gc-play {
  color: #0f9b8e;
  transform: translateX(4px);
}

/* --- Game player --- */
.game-player {
  animation: fadeUp 0.5s ease;
}
.gp-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.gp-back {
  background: none; border: none;
  color: rgba(255,255,255,0.4);
  font-size: 13px; cursor: pointer;
  font-family: inherit;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s ease;
  display: flex; align-items: center; gap: 4px;
}
.gp-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.08); }
.gp-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
}
.gp-frame-wrap {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  background: #000;
  aspect-ratio: 9 / 16;
  max-height: 80vh;
}
.gp-frame {
  width: 100%;
  height: 100%;
  display: block;
}

/* ========== Light mode ========== */
.games-page.theme-light {
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
.theme-light .game-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
}
.theme-light .game-card:hover {
  border-color: rgba(15,155,142,0.12);
  background: rgba(15,155,142,0.02);
}
.theme-light .gc-title { color: #1d2129; }
.theme-light .gc-desc { color: rgba(0,0,0,0.25); }
.theme-light .gp-title { color: rgba(0,0,0,0.4); }
.theme-light .gp-back { color: rgba(0,0,0,0.3); }

@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .hero-title { font-size: 1.6rem; }
  .game-card { padding: 16px 18px; }
  .gp-frame-wrap { max-height: 70vh; }
}
</style>
