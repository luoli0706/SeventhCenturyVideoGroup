<template>
  <div class="threed-page">
    <!-- 背景层 -->
    <div class="bg-layer">
      <div class="bg-grid"></div>
      <div class="bg-scanline"></div>
      <div class="bg-orb" ref="orbRef"></div>
    </div>

    <!-- 导航 -->
    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
      <span class="nav-badge">三维</span>
    </nav>

    <!-- 主内容 -->
    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <div class="hero-hud">
          <div class="hud-ring">
            <svg viewBox="0 0 100 100" class="hud-svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(15,155,142,0.12)" stroke-width="0.5"/>
              <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(15,155,142,0.08)" stroke-width="0.3"/>
              <path d="M10 50 L90 50 M50 10 L50 90" stroke="rgba(15,155,142,0.06)" stroke-width="0.3"/>
            </svg>
            <span class="hud-icon">3D</span>
          </div>
          <div class="hud-corners">
            <span class="hud-corner tl"></span>
            <span class="hud-corner tr"></span>
            <span class="hud-corner bl"></span>
            <span class="hud-corner br"></span>
          </div>
        </div>
        <div class="hero-badge">MMD · 三维演出</div>
        <h1 class="hero-title">三维</h1>
        <p class="hero-subtitle">MikuMikuDance · 3D Animation · Virtual Performance</p>
        <p class="hero-desc">
          基于 MikuMikuDance 引擎的 3D 动画创作 —— 模型、动作、镜头、光影，在虚拟空间中构建真实的演出。
        </p>
        <!-- 关键指标 -->
        <div class="hero-metrics">
          <div class="metric">
            <span class="metric-val">PMX</span>
            <span class="metric-lbl">模型格式</span>
          </div>
          <div class="metric-div"></div>
          <div class="metric">
            <span class="metric-val">VMD</span>
            <span class="metric-lbl">动作文件</span>
          </div>
          <div class="metric-div"></div>
          <div class="metric">
            <span class="metric-val">MME</span>
            <span class="metric-lbl">特效插件</span>
          </div>
          <div class="metric-div"></div>
          <div class="metric">
            <span class="metric-val">IK</span>
            <span class="metric-lbl">逆向动力学</span>
          </div>
        </div>
      </header>

      <!-- 基础概念 -->
      <section class="section">
        <h2 class="section-title"><span class="title-accent">//</span> 基础概念</h2>
        <div class="concept-grid">
          <div class="concept-card" v-for="(item, i) in concepts" :key="i" :style="{ '--c-idx': i }">
            <div class="concept-header">
              <span class="concept-tag">{{ item.tag }}</span>
              <span class="concept-arrow">→</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 标准工作流 -->
      <section class="section">
        <h2 class="section-title"><span class="title-accent">//</span> 标准工作流</h2>
        <div class="workflow">
          <div v-for="(step, i) in workflow" :key="i" class="wf-node" :style="{ '--w-idx': i }">
            <div class="wf-node-inner">
              <div class="wf-num">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="wf-icon">{{ step.icon }}</div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 社团定位 -->
      <section class="section">
        <h2 class="section-title"><span class="title-accent">//</span> 社团定位</h2>
        <div class="mission-card">
          <p>柒世纪视频组设立 <strong>MMD 三维演出研究组</strong>，与 MAD 剪辑研究组并行发展。成员固定方向深耕，共享行政支持、资源仓与培训档案。</p>
          <div class="mission-principles">
            <div class="principle">
              <span class="p-icon">🎯</span>
              <span>固定方向深耕</span>
            </div>
            <div class="principle">
              <span class="p-icon">📦</span>
              <span>共享资源支持</span>
            </div>
            <div class="principle">
              <span class="p-icon">⚖️</span>
              <span>版权合规创作</span>
            </div>
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
function goBack() { router.push('/home') }

const orbRef = ref(null)

onMounted(() => {
  const orb = orbRef.value
  if (!orb) return
  let angle = 0
  setInterval(() => {
    angle += 0.005
    const x = Math.sin(angle) * 15
    const y = Math.cos(angle * 0.7) * 10
    orb.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }, 50)
})

const concepts = [
  { tag: 'MMD', title: 'MikuMikuDance', desc: '由樋口优开发的免费 3D 动画软件，支持角色模型、舞蹈动作、摄像机与物理效果编辑。' },
  { tag: 'PMX', title: '角色模型', desc: 'PMX/PMD 模型格式，可通过 PMX Editor 定制材质、骨骼、表情，是 MMD 创作的核心资产。' },
  { tag: 'VMD', title: '动作数据', desc: 'VMD 文件记录骨骼动画与摄像机运动，可复用与二次编辑，是动作设计的核心载体。' },
  { tag: 'PHYS', title: '物理与 IK', desc: '内建 Bullet 物理引擎，支持刚体/关节调试；IK 逆向动力学用于控制四肢定位。' },
]

const workflow = [
  { icon: '📋', title: '选题与参考', desc: '确定舞曲、舞蹈编排或剧情场景，收集参考镜头。' },
  { icon: '📥', title: '资源导入', desc: '加载 PMX 模型、VMD 动作、表情文件、道具与舞台。' },
  { icon: '🎬', title: '动作与镜头', desc: '使用 VMD 或手动关键帧调整，控制构图与景深。' },
  { icon: '💡', title: '光影与特效', desc: 'MME 插件（Ray-MMD、ikLens）调整 Toon 阴影与投影。' },
  { icon: '⚙️', title: '物理调试', desc: '检查裙摆、头发碰撞，设置补偿骨骼或关闭局部物理。' },
  { icon: '🎞️', title: '渲染输出', desc: 'AVI/PNG 序列输出，后期完成剪辑与调色。' },
]
</script>

<style scoped>
/* ==============================
   三维 — 科技·空间·未来
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.threed-page {
  min-height: 100vh;
  background: #050510;
  color: #e0e8ef;
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

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 155, 142, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 155, 142, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

.bg-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(15, 155, 142, 0.015) 2px,
    rgba(15, 155, 142, 0.015) 3px
  );
}

.bg-orb {
  position: absolute;
  top: 25%;
  left: 50%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15, 155, 142, 0.06) 0%, transparent 60%);
  filter: blur(20px);
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
  background: rgba(5, 5, 16, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 155, 142, 0.06);
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
  background: rgba(15, 155, 142, 0.1);
  color: #0f9b8e;
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
  animation: fadeIn 1s ease;
}

.hero-hud {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
}

.hud-ring {
  position: relative;
  width: 100%;
  height: 100%;
  animation: hudSpin 20s linear infinite;
}

@keyframes hudSpin {
  to { transform: rotate(360deg); }
}

.hud-svg {
  width: 100%;
  height: 100%;
}

.hud-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: #0f9b8e;
  letter-spacing: -2px;
  opacity: 0.6;
}

.hud-corners {
  position: absolute;
  inset: -6px;
}

.hud-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: rgba(15, 155, 142, 0.2);
  border-style: solid;
}

.hud-corner.tl { top: 0; left: 0; border-width: 1px 0 0 1px; }
.hud-corner.tr { top: 0; right: 0; border-width: 1px 1px 0 0; }
.hud-corner.bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; }
.hud-corner.br { bottom: 0; right: 0; border-width: 0 1px 1px 0; }

.hero-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  color: rgba(15, 155, 142, 0.5);
  margin-bottom: 16px;
  text-transform: uppercase;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: 8px;
  background: linear-gradient(135deg, #0f9b8e 0%, #4dd0c8 50%, #0f9b8e 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleShine 4s ease-in-out infinite;
}

@keyframes titleShine {
  0%, 100% { background-position: 0% center; }
  50%      { background-position: 100% center; }
}

.hero-subtitle {
  font-size: 0.85rem;
  font-weight: 400;
  color: rgba(255,255,255,0.2);
  letter-spacing: 3px;
  font-family: 'JetBrains Mono', monospace;
  margin: 0 0 20px;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.45);
  max-width: 600px;
  margin: 0 auto 36px;
}

.hero-metrics {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 20px;
}

.metric-val {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f9b8e;
  font-family: 'JetBrains Mono', monospace;
}

.metric-lbl {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.25);
  letter-spacing: 1px;
}

.metric-div {
  width: 1px;
  height: 30px;
  background: rgba(15, 155, 142, 0.1);
}

/* --- Section --- */
.section {
  margin-top: 80px;
  animation: fadeIn 0.8s ease backwards;
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
  gap: 8px;
}

.title-accent {
  color: rgba(15, 155, 142, 0.3);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 400;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(15, 155, 142, 0.2), transparent);
}

/* --- Concept cards --- */
.concept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
}

.concept-card {
  padding: 24px 20px;
  border-radius: 14px;
  border: 1px solid rgba(15, 155, 142, 0.06);
  background: rgba(15, 155, 142, 0.02);
  transition: all 0.35s ease;
  animation: fadeIn 0.6s ease backwards;
  animation-delay: calc(var(--c-idx) * 0.1s);
}

.concept-card:hover {
  border-color: rgba(15, 155, 142, 0.2);
  background: rgba(15, 155, 142, 0.04);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(15, 155, 142, 0.06);
}

.concept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.concept-tag {
  font-size: 10px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(15, 155, 142, 0.08);
  color: #0f9b8e;
  letter-spacing: 1px;
}

.concept-arrow {
  font-size: 1.1rem;
  color: rgba(15, 155, 142, 0.2);
}

.concept-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px;
  color: #fff;
}

.concept-card p {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

/* --- Workflow --- */
.workflow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.wf-node {
  perspective: 800px;
  animation: fadeIn 0.6s ease backwards;
  animation-delay: calc(var(--w-idx) * 0.08s);
}

.wf-node-inner {
  padding: 28px 20px;
  border-radius: 14px;
  border: 1px solid rgba(15, 155, 142, 0.06);
  background: rgba(15, 155, 142, 0.015);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.wf-node-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(15, 155, 142, 0.03), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.wf-node-inner:hover {
  border-color: rgba(15, 155, 142, 0.2);
  transform: translateY(-4px) rotateX(2deg);
  box-shadow: 0 12px 40px rgba(15, 155, 142, 0.06);
}

.wf-node-inner:hover::before {
  opacity: 1;
}

.wf-num {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(15, 155, 142, 0.15);
  margin-bottom: 8px;
}

.wf-icon {
  font-size: 1.6rem;
  margin-bottom: 10px;
}

.wf-node-inner h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: #fff;
}

.wf-node-inner p {
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

/* --- Mission --- */
.mission-card {
  padding: 32px 28px;
  border-radius: 16px;
  border: 1px solid rgba(15, 155, 142, 0.08);
  background: rgba(15, 155, 142, 0.02);
}

.mission-card p {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.5);
  margin: 0 0 20px;
}

.mission-card strong {
  color: #0f9b8e;
}

.mission-principles {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.principle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(15, 155, 142, 0.04);
  border: 1px solid rgba(15, 155, 142, 0.06);
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
}

.p-icon {
  font-size: 1rem;
}

/* --- Keyframes --- */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .hero-title { font-size: 2.8rem; }
  .hero-metrics { flex-direction: column; gap: 8px; }
  .metric-div { display: none; }
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 60px; }
  .concept-grid, .workflow { grid-template-columns: 1fr; }
  .mission-principles { flex-direction: column; }
}
</style>
