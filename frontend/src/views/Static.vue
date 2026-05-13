<template>
  <div class="static-page">
    <!-- 背景 -->
    <div class="bg-layer">
      <div class="bg-glow"></div>
      <div class="bg-lines"></div>
    </div>

    <!-- 导航 -->
    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
      <span class="nav-badge">静止系</span>
    </nav>

    <!-- 主内容 -->
    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <div class="hero-emblem">
          <div class="emblem-ring"></div>
          <span class="emblem-text">静</span>
        </div>
        <div class="hero-badge">静画 · M@D · MMV</div>
        <h1 class="hero-title">
          <span class="title-char" v-for="(c, i) in '静止系'" :key="i" :style="{ '--char-i': i }">{{ c }}</span>
        </h1>
        <p class="hero-subtitle">Still Frame · Motion Graphics · Visual Poetry</p>
        <p class="hero-desc">
          以静态图片为素材——漫画、插画、CG——通过精准的镜头运动、文案设计与分镜逻辑，在静止中创造出流动的叙事。
        </p>
        <div class="hero-quote">
          <span class="quote-mark">"</span>
          静止不是缺乏动作，而是动作的凝练
          <span class="quote-mark">"</span>
        </div>
      </header>

      <!-- 核心理念 -->
      <section class="section">
        <h2 class="section-title">核心理念</h2>
        <div class="ethos-grid">
          <div class="ethos-card" style="--e-idx: 0">
            <div class="ethos-number">01</div>
            <h3>镜头即笔触</h3>
            <p>摄像机推拉摇移取代角色动作，每一帧构图为文字服务，创造阅读般的视觉节奏。</p>
          </div>
          <div class="ethos-card" style="--e-idx: 1">
            <div class="ethos-number">02</div>
            <h3>文案即灵魂</h3>
            <p>静止系的精髓在于文字与画面的对位——一句文案可以扭转整段影像的情绪走向。</p>
          </div>
          <div class="ethos-card" style="--e-idx: 2">
            <div class="ethos-number">03</div>
            <h3>留白即力量</h3>
            <p>不依赖连续动作的冲击力，而是用停顿与空白构建张力，让观众在间歇中感受情绪。</p>
          </div>
        </div>
      </section>

      <!-- 技法展示 -->
      <section class="section">
        <h2 class="section-title">核心技法</h2>
        <div class="tech-grid">
          <div class="tech-item" v-for="(item, i) in techniques" :key="i" :style="{ '--t-idx': i }">
            <div class="tech-visual">
              <div class="tech-bar" :style="{ width: item.level + '%' }"></div>
            </div>
            <div class="tech-info">
              <span class="tech-name">{{ item.name }}</span>
              <span class="tech-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 代表分支 -->
      <section class="section">
        <h2 class="section-title">代表分支</h2>
        <div class="branch-grid">
          <div class="branch-card" style="--b-idx: 0">
            <div class="branch-visual">
              <div class="branch-icon-wrap">
                <span class="branch-icon">M</span>
              </div>
            </div>
            <h3>MMV</h3>
            <p>Comic Music Video — 以漫画原页为素材，利用数字变焦与分镜重组呈现漫画原作的故事性与冲击力。</p>
          </div>
          <div class="branch-card" style="--b-idx: 1">
            <div class="branch-visual">
              <div class="branch-icon-wrap">
                <span class="branch-icon">@</span>
              </div>
            </div>
            <h3>静止系 M@D</h3>
            <p>重视文案撰写与分镜间逻辑关系的静止系作品，常以诗歌体或独白体为文本骨架，搭配精心设计的视觉节奏。</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() { router.push('/home') }

const techniques = [
  { name: '镜头运动', desc: '推拉摇移跟升降，模拟电影镜头语言', level: 95 },
  { name: '文案编排', desc: '字体选择、文字动画、信息层级', level: 90 },
  { name: '节奏控制', desc: '通过画面停留时长创造音乐感', level: 85 },
  { name: '色彩统一', desc: 'LUT 调色塑造整体情绪基调', level: 80 },
  { name: '转场过渡', desc: '溶解、擦除、缩放等静帧过渡技法', level: 75 },
  { name: '声音设计', desc: '环境音、FX 与音乐的空间层次', level: 70 },
]
</script>

<style scoped>
/* ==============================
   静止系 — 凝练·优雅·叙事
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

.static-page {
  min-height: 100vh;
  background: #0a0a14;
  color: #e8e8ef;
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

.bg-glow {
  position: absolute;
  top: 10%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(230, 168, 23, 0.05) 0%, transparent 60%);
  animation: glowPulse 6s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50%      { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.bg-lines {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px);
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
  background: rgba(10, 10, 20, 0.8);
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
  background: rgba(230, 168, 23, 0.1);
  color: #e6a817;
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
  animation: fadeUp 1s ease;
}

.hero-emblem {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emblem-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(230, 168, 23, 0.3);
  border-radius: 50%;
  animation: emblemSpin 12s linear infinite;
}

@keyframes emblemSpin {
  to { transform: rotate(360deg); }
}

.emblem-text {
  font-size: 1.6rem;
  font-weight: 700;
  color: #e6a817;
  font-family: 'Noto Serif SC', serif;
  opacity: 0.8;
}

.hero-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  color: rgba(230, 168, 23, 0.5);
  margin-bottom: 20px;
  text-transform: uppercase;
}

.hero-title {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 0 0 20px;
}

.title-char {
  font-size: 4.5rem;
  font-weight: 700;
  font-family: 'Noto Serif SC', serif;
  color: #e6a817;
  text-shadow: 0 0 40px rgba(230, 168, 23, 0.15);
  animation: charAppear 0.6s ease backwards;
  animation-delay: calc(var(--char-i) * 0.12s + 0.3s);
}

@keyframes charAppear {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-subtitle {
  font-size: 0.9rem;
  font-weight: 300;
  color: rgba(255,255,255,0.2);
  letter-spacing: 4px;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  margin: 0 0 16px;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.45);
  max-width: 600px;
  margin: 0 auto 32px;
}

.hero-quote {
  font-size: 1.1rem;
  color: rgba(230, 168, 23, 0.6);
  font-family: 'Noto Serif SC', serif;
  font-style: italic;
  letter-spacing: 2px;
}

.quote-mark {
  font-size: 1.4em;
  color: rgba(230, 168, 23, 0.3);
  font-family: 'Cormorant Garamond', serif;
  margin: 0 4px;
}

/* --- Section --- */
.section {
  margin-top: 80px;
  animation: fadeUp 0.8s ease backwards;
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
  color: #e6a817;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(230, 168, 23, 0.2), transparent);
}

/* --- Ethos --- */
.ethos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.ethos-card {
  padding: 32px 24px;
  border-radius: 16px;
  border: 1px solid rgba(230, 168, 23, 0.06);
  background: rgba(230, 168, 23, 0.02);
  transition: all 0.4s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--e-idx) * 0.12s);
}

.ethos-card:hover {
  border-color: rgba(230, 168, 23, 0.15);
  background: rgba(230, 168, 23, 0.04);
  transform: translateY(-4px);
}

.ethos-number {
  font-size: 2.2rem;
  font-weight: 700;
  font-family: 'Cormorant Garamond', serif;
  color: rgba(230, 168, 23, 0.15);
  margin-bottom: 12px;
  line-height: 1;
}

.ethos-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 10px;
  color: #e6a817;
}

.ethos-card p {
  font-size: 0.88rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.45);
  margin: 0;
}

/* --- Tech --- */
.tech-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.3s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--t-idx) * 0.08s);
}

.tech-item:hover {
  background: rgba(230, 168, 23, 0.03);
  border-color: rgba(230, 168, 23, 0.1);
}

.tech-visual {
  flex-shrink: 0;
  width: 120px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.04);
  overflow: hidden;
}

.tech-bar {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(230, 168, 23, 0.3), #e6a817);
  transition: width 0.8s ease;
}

.tech-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tech-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.tech-desc {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.35);
}

/* --- Branch --- */
.branch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.branch-card {
  padding: 32px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  text-align: center;
  transition: all 0.4s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--b-idx) * 0.12s);
}

.branch-card:hover {
  border-color: rgba(230, 168, 23, 0.15);
  transform: translateY(-4px);
}

.branch-visual {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.branch-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(230, 168, 23, 0.06);
  border: 1px solid rgba(230, 168, 23, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.branch-icon {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Cormorant Garamond', serif;
  color: #e6a817;
}

.branch-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 10px;
  color: #fff;
}

.branch-card p {
  font-size: 0.88rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.45);
  margin: 0;
}

/* --- Keyframes --- */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .title-char { font-size: 3rem; }
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 60px; }
  .ethos-grid, .branch-grid { grid-template-columns: 1fr; }
}
</style>
