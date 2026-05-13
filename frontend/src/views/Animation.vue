<template>
  <div :class="['animation-page', isDark ? 'theme-dark' : 'theme-light']">
    <!-- 动态背景层 -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
      </div>
    </div>

    <!-- 导航 -->
    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
      <span class="nav-badge">动画系</span>
    </nav>

    <!-- 主内容 -->
    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <div class="hero-badge">MAD · AMV</div>
        <h1 class="hero-title">
          <span class="title-line">动画系</span>
          <span class="title-sub">Animation Music Video</span>
        </h1>
        <p class="hero-desc">
          将现有动画、漫画、游戏等素材重新剪辑、合成，形成全新的视频作品 — 这是属于创作者的二次表达。
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">Action</span>
            <span class="stat-label">战斗节奏</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">Dance</span>
            <span class="stat-label">舞蹈同步</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">Drama</span>
            <span class="stat-label">剧情叙事</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">Psyche</span>
            <span class="stat-label">意境氛围</span>
          </div>
        </div>
      </header>

      <!-- 分类卡片 -->
      <section class="section">
        <h2 class="section-title">分类体系</h2>
        <div class="card-grid">
          <div class="info-card card-anime" style="--card-idx: 0">
            <div class="card-icon">🎬</div>
            <h3>动画系 AMV</h3>
            <p>以动画片段与音乐同步为核心，涵盖 Action、Dance、Drama、Romance、Psyche、Horror、VFX、FX 等多种风格分支。</p>
          </div>
          <div class="info-card card-static" style="--card-idx: 1">
            <div class="card-icon">🖼️</div>
            <h3>静止系 M@D</h3>
            <p>主要使用静态图片（漫画、插画、CG）的作品。重视文案设计与分镜间逻辑，通过镜头运动打造叙事节奏。</p>
          </div>
          <div class="info-card card-mix" style="--card-idx: 2">
            <div class="card-icon">🌀</div>
            <h3>混合系</h3>
            <p>在同一作品中混用动画、静止图、原创特效等多种素材的融合表达，打破素材边界，追求极致创意。</p>
          </div>
        </div>
      </section>

      <!-- 创作流程 -->
      <section class="section">
        <h2 class="section-title">创作流程</h2>
        <div class="flow-timeline">
          <div v-for="(step, i) in flowSteps" :key="i" class="flow-step" :style="{ '--step-idx': i }">
            <div class="step-number">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 工具生态 -->
      <section class="section">
        <h2 class="section-title">工具生态</h2>
        <div class="tools-grid">
          <div v-for="(tool, i) in tools" :key="i" class="tool-chip" :style="{ '--tool-idx': i }">
            <span class="tool-cat">{{ tool.cat }}</span>
            <span class="tool-name">{{ tool.name }}</span>
          </div>
        </div>
      </section>
    </main>
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

function goBack() { router.push('/home') }

function particleStyle(i) {
  const size = 3 + Math.random() * 6
  return {
    width: size + 'px',
    height: size + 'px',
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 5 + 's',
    animationDuration: (3 + Math.random() * 4) + 's',
    opacity: 0.2 + Math.random() * 0.4,
  }
}

const flowSteps = [
  { title: '立项策划', desc: '确定主题、情绪曲线、目标观众，制作脚本与配乐结构。' },
  { title: '素材整理', desc: '确保素材来源合法，记录片段时间码，静态图先行清理裁切。' },
  { title: '剪辑与特效', desc: '时间线粗剪 → 精剪 → 节奏校准（Beat Matching），添加转场与粒子光效。' },
  { title: '调色与音频', desc: '统一画面风格（LUT/曲线），处理对白、环境音与音乐音量平衡。' },
  { title: '输出与反馈', desc: 'H.264/H.265 输出，保留高码率母带，邀请社团内测评迭代。' },
]

const tools = [
  { cat: '剪辑', name: 'Premiere Pro / DaVinci Resolve / Vegas Pro' },
  { cat: '特效', name: 'After Effects + Trapcode / Sapphire / BCC' },
  { cat: '合成', name: 'Blender' },
  { cat: '音频', name: 'Adobe Audition / Reaper' },
  { cat: '素材管理', name: 'Daminion / Notion / Excel 时间轴' },
]

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
</script>

<style scoped>
/* ==============================
   动画系 — 动态·能量·节奏
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');

.animation-page {
  min-height: 100vh;
  background: #07070f;
  color: #e8e8ef;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* --- 动态背景 --- */
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
    radial-gradient(ellipse at 20% 20%, rgba(230, 100, 50, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(15, 155, 142, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(230, 168, 23, 0.04) 0%, transparent 60%);
}

.bg-particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(230, 168, 23, 0.5);
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  20%  { opacity: 0.5; }
  80%  { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0); opacity: 0; }
}

/* --- 导航 --- */
.page-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(7, 7, 15, 0.8);
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
  color: #e6a817;
  background: rgba(230, 168, 23, 0.08);
}

.nav-arrow {
  display: inline-block;
  transition: transform 0.25s ease;
}
.nav-back:hover .nav-arrow { transform: translateX(-3px); }

.nav-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
  background: rgba(230, 100, 50, 0.15);
  color: #e66432;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* --- 主内容 --- */
.page-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 100px 24px 80px;
}

/* --- Hero --- */
.hero {
  text-align: center;
  padding: 60px 0 50px;
  animation: fadeInUp 0.8s ease;
}

.hero-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba(230, 100, 50, 0.12);
  color: #e66432;
  border: 1px solid rgba(230, 100, 50, 0.2);
  margin-bottom: 24px;
  text-transform: uppercase;
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 20px;
}

.title-line {
  font-size: 4rem;
  font-weight: 800;
  letter-spacing: 6px;
  background: linear-gradient(135deg, #e66432 0%, #e6a817 50%, #0f9b8e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.title-sub {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255,255,255,0.3);
  letter-spacing: 4px;
  text-transform: uppercase;
  font-family: 'Space Grotesk', monospace;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.5);
  max-width: 600px;
  margin: 0 auto 36px;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 20px;
}

.stat-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e6a817;
  font-family: 'Space Grotesk', monospace;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255,255,255,0.06);
}

/* --- Section --- */
.section {
  margin-top: 80px;
  animation: fadeInUp 0.8s ease backwards;
}
.section:nth-of-type(2) { animation-delay: 0.15s; }
.section:nth-of-type(3) { animation-delay: 0.3s; }
.section:nth-of-type(4) { animation-delay: 0.45s; }

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 28px;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(230, 168, 23, 0.3), transparent);
}

/* --- Cards --- */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-card {
  padding: 32px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease backwards;
  animation-delay: calc(var(--card-idx) * 0.12s);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.card-anime { background: rgba(230, 100, 50, 0.04); }
.card-anime::before { background: linear-gradient(90deg, #e66432, #e6a817); }

.card-static { background: rgba(230, 168, 23, 0.04); }
.card-static::before { background: linear-gradient(90deg, #e6a817, #0f9b8e); }

.card-mix { background: rgba(15, 155, 142, 0.04); }
.card-mix::before { background: linear-gradient(90deg, #0f9b8e, #e66432); }

.info-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255,255,255,0.12);
}

.info-card:hover::before {
  opacity: 1;
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}

.info-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: #fff;
}

.info-card p {
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

/* --- Timeline --- */
.flow-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.flow-step {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  border-left: 1px solid rgba(255,255,255,0.06);
  padding-left: 24px;
  position: relative;
  animation: fadeInUp 0.6s ease backwards;
  animation-delay: calc(var(--step-idx) * 0.1s);
}

.flow-step::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 24px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e6a817;
  box-shadow: 0 0 12px rgba(230, 168, 23, 0.4);
}

.flow-step:last-child {
  border-left-color: transparent;
}

.step-number {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: 'Space Grotesk', monospace;
  color: rgba(230, 168, 23, 0.3);
  min-width: 50px;
  line-height: 1.2;
}

.step-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: #fff;
}

.step-content p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.45);
  margin: 0;
}

/* --- Tools --- */
.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tool-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease backwards;
  animation-delay: calc(var(--tool-idx) * 0.08s);
}

.tool-chip:hover {
  background: rgba(15, 155, 142, 0.06);
  border-color: rgba(15, 155, 142, 0.2);
  transform: translateY(-2px);
}

.tool-cat {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(230, 168, 23, 0.1);
  color: #e6a817;
}

.tool-name {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
}

/* --- Keyframes --- */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .title-line { font-size: 2.5rem; }
  .hero-stats { flex-direction: column; gap: 12px; }
  .stat-divider { display: none; }
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 60px; }
  .card-grid { grid-template-columns: 1fr; }
}

/* ========== Light mode ========== */
.theme-light {
  background: #f5f7fb;
  color: #1d2129;
}
.theme-light .page-nav {
  background: rgba(255,255,255,0.9);
  border-bottom-color: rgba(0,0,0,0.06);
}
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.06); }
.theme-light .nav-badge {
  color: rgba(0,0,0,0.4);
  border-color: rgba(0,0,0,0.06);
}
.theme-light .title-line {
  background: linear-gradient(135deg, #e66432, #e6a817);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.theme-light .title-sub { color: rgba(0,0,0,0.2); }
.theme-light .hero-desc { color: rgba(0,0,0,0.35); }
.theme-light .stat-label { color: rgba(0,0,0,0.2); }
.theme-light .stat-divider { background: rgba(0,0,0,0.06); }
.theme-light .section-title { color: #1d2129; }
.theme-light .section-title::after {
  background: linear-gradient(to right, rgba(230,168,23,0.2), transparent);
}
.theme-light .info-card { border-color: rgba(0,0,0,0.06); }
.theme-light .info-card h3 { color: #1d2129; }
.theme-light .info-card p { color: rgba(0,0,0,0.45); }
.theme-light .card-anime { background: rgba(230,100,50,0.04); }
.theme-light .card-static { background: rgba(230,168,23,0.03); }
.theme-light .card-mix { background: rgba(15,155,142,0.03); }
.theme-light .info-card:hover { border-color: rgba(0,0,0,0.1); }
.theme-light .flow-step { border-left-color: rgba(0,0,0,0.06); }
.theme-light .step-number { color: rgba(230,168,23,0.25); }
.theme-light .step-content h3 { color: #1d2129; }
.theme-light .step-content p { color: rgba(0,0,0,0.4); }
.theme-light .tool-chip {
  background: rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.06);
}
.theme-light .tool-chip:hover {
  background: rgba(15,155,142,0.04);
  border-color: rgba(15,155,142,0.12);
}
.theme-light .tool-name { color: rgba(0,0,0,0.5); }
</style>
