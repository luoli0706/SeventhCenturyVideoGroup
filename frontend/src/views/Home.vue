<template>
  <div :class="['bg-wrapper', isDark ? 'bg-dark' : 'bg-light']">
    <!-- 右上角圣诞树链接 -->
    <div class="christmas-link">
      <a href="http://7thcv.cn:1225/" target="_blank" rel="noopener noreferrer" title="访问特别页面">
        🎄
      </a>
    </div>

    <!-- 装饰性角落元素 -->
    <div class="corner-deco top-left"></div>
    <div class="corner-deco bottom-right"></div>
    <div class="noise-overlay"></div>

    <div class="home-bg">
      <div class="bg-ambient"></div>
      <div class="bg-ambient-secondary"></div>
      <div class="content-wrapper">
        <div class="department-links">
          <a-space direction="horizontal" size="large">
            <router-link to="/animation">
              <a-button type="outline" size="small">动画系</a-button>
            </router-link>
            <router-link to="/static">
              <a-button type="outline" size="small">静止系</a-button>
            </router-link>
            <router-link to="/3d">
              <a-button type="outline" size="small">三维</a-button>
            </router-link>
          </a-space>
        </div>
        <a-divider style="margin: 16px 0; width: 280px;" />
        <ThemeSwitcher />
        <Title />
        <SearchBox />
        <HomeMenu :is-dark="isDark" />
      </div>
    </div>
    <div class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        闽ICP备2025101374号
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Title from '../components/Title.vue'
import SearchBox from '../components/SearchBox.vue'
import HomeMenu from '../components/HomeMenuNew.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'

const isDark = ref(false)

const updateTheme = () => {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
</script>

<style>
/* ============================================
   Global animations
   ============================================ */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes ambientDrift {
  0%   { transform: translate(-50%, -50%) scale(1); }
  50%  { transform: translate(-50%, -50%) scale(1.15); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

@keyframes cornerPulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.6; }
}
</style>

<style scoped>
.bg-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition: background 0.5s ease;
  position: relative;
}

/* --- 圣诞链接 --- */
.christmas-link {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 100;
  animation: fadeIn 0.6s ease;
}

.christmas-link a {
  display: inline-block;
  font-size: 30px;
  text-decoration: none;
  transition: transform 0.3s ease, filter 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
}

.christmas-link a:hover {
  transform: scale(1.25) rotate(8deg);
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.35));
}

/* --- 装饰角落 --- */
.corner-deco {
  position: fixed;
  width: 120px;
  height: 120px;
  pointer-events: none;
  z-index: 0;
  animation: cornerPulse 4s ease-in-out infinite;
}

.corner-deco.top-left {
  top: 0;
  left: 0;
  border-top: 2px solid rgba(15, 155, 142, 0.15);
  border-left: 2px solid rgba(15, 155, 142, 0.15);
}

.corner-deco.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid rgba(15, 155, 142, 0.15);
  border-right: 2px solid rgba(15, 155, 142, 0.15);
}

.bg-light .corner-deco {
  border-color: rgba(22, 93, 255, 0.1);
}

/* --- 噪点纹理 --- */
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  mix-blend-mode: overlay;
}

.bg-dark .noise-overlay {
  opacity: 0.2;
}

/* --- 背景主题 --- */
.bg-light {
  background: linear-gradient(135deg, #f5f7fb 0%, #eef1f8 40%, #e6ebf4 100%);
}
.bg-dark {
  background: linear-gradient(135deg, #07070f 0%, #0d0d1a 40%, #0a0a16 100%);
}

/* --- 氛围光 --- */
.bg-ambient {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

.bg-dark .bg-ambient {
  top: 15%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(15, 155, 142, 0.06) 0%, transparent 65%);
  animation: ambientDrift 10s ease-in-out infinite;
}

.bg-light .bg-ambient {
  top: 10%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.035) 0%, transparent 65%);
  animation: ambientDrift 12s ease-in-out infinite;
}

.bg-ambient-secondary {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

.bg-dark .bg-ambient-secondary {
  bottom: 0;
  right: 0;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(230, 168, 23, 0.04) 0%, transparent 60%);
  animation: ambientDrift 14s ease-in-out infinite reverse;
}

.bg-light .bg-ambient-secondary {
  bottom: 0;
  right: 0;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(230, 168, 23, 0.025) 0%, transparent 60%);
  animation: ambientDrift 16s ease-in-out infinite reverse;
}

/* --- 中央内容 --- */
.home-bg {
  flex: 1;
  min-width: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  position: relative;
  z-index: 2;
  padding-top: 15vh;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
  transform: scale(1.08);
  transform-origin: top center;
}

.content-wrapper > * {
  animation: fadeInUp 0.6s ease backwards;
}
.content-wrapper > *:nth-child(1) { animation-delay: 0.05s; }
.content-wrapper > *:nth-child(2) { animation-delay: 0.15s; }
.content-wrapper > *:nth-child(3) { animation-delay: 0.25s; }
.content-wrapper > *:nth-child(4) { animation-delay: 0.35s; }
.content-wrapper > *:nth-child(5) { animation-delay: 0.45s; }
.content-wrapper > *:nth-child(6) { animation-delay: 0.55s; }

/* --- 系别按钮 --- */
.department-links {
  margin-bottom: 8px;
}
.department-links .arco-btn {
  font-size: 0.9em;
  padding: 6px 18px;
  transition: all 0.25s ease;
  border-radius: 20px !important;
}
.department-links .arco-btn:hover {
  transform: translateY(-2px);
}

/* --- ICP 页脚 --- */
.icp-footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  text-align: center;
  padding: 10px 0;
  background: rgba(255,255,255,0.6);
  font-size: 0.85em;
  z-index: 99;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fadeIn 1s ease 0.8s backwards;
  letter-spacing: 0.5px;
}

.bg-dark .icp-footer {
  background: rgba(10, 10, 22, 0.7);
}

.icp-footer a {
  color: #165dff;
  text-decoration: none;
  transition: opacity 0.2s;
}

.bg-dark .icp-footer a {
  color: rgba(15, 155, 142, 0.6);
}

.icp-footer a:hover {
  opacity: 0.7;
}
</style>
