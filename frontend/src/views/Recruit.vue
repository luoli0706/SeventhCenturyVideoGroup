<template>
  <div :class="['recruit-page', isDark ? 'theme-dark' : 'theme-light']">
    <!-- 背景层 -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <!-- 顶部导航 -->
    <nav class="top-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回主页
      </button>
    </nav>

    <main class="page-content">
      <!-- ========= Hero ========= -->
      <header class="hero">
        <div class="hero-badge">招新开放中</div>
        <h1 class="hero-title">
          <span class="hero-line" v-for="(line, i) in ['柒世纪视频组', '2026 招新']" :key="i" :style="{ '--l-i': i }">{{ line }}</span>
        </h1>
        <p class="hero-desc">
          无论你是热爱剪辑的 MAD 创作者，还是沉醉于 3D 演出的 MMD 玩家，<br>
          这里都有一群和你一样的人。
        </p>
      </header>

      <!-- ========= 社团简介 ========= -->
      <section class="section">
        <h2 class="section-title">关于我们</h2>
        <div class="about-card">
          <p>柒世纪视频组（Seventh Century Video Group）是一个专注于 <strong>MAD 剪辑</strong> 与 <strong>MMD 三维演出</strong> 的创作研究社团。我们拥有两条独立研发线，成员在各自方向深耕，共享行政支持与培训资源。</p>
          <div class="about-motto">在各自的创作范围内坚持版权合规，尊重原作者与素材授权要求。</div>
        </div>
      </section>

      <!-- ========= 两大方向 ========= -->
      <section class="section">
        <h2 class="section-title">研究方向</h2>
        <div class="tracks">
          <div class="track-card track-mad">
            <div class="track-glow"></div>
            <div class="track-header">
              <span class="track-badge">MAD 剪辑研究组</span>
              <span class="track-icon">🎬</span>
            </div>
            <h3>动画·静止·混合</h3>
            <ul>
              <li>动画/漫画/影像素材剪辑研究</li>
              <li>节奏设计、Beat Matching</li>
              <li>特效合成（After Effects）</li>
              <li>调色与音频后期</li>
            </ul>
            <div class="track-tools">
              <span>Premiere Pro</span><span>AE</span><span>DaVinci</span>
            </div>
          </div>
          <div class="track-divider">
            <span class="td-icon">✦</span>
          </div>
          <div class="track-card track-mmd">
            <div class="track-glow"></div>
            <div class="track-header">
              <span class="track-badge">MMD 三维演出研究组</span>
              <span class="track-icon">🤖</span>
            </div>
            <h3>模型·动作·舞台</h3>
            <ul>
              <li>角色模型（PMX/PMD）制作与定制</li>
              <li>VMD 动作数据与镜头设计</li>
              <li>MME 光影特效与 Ray-MMD</li>
              <li>物理调试与渲染输出</li>
            </ul>
            <div class="track-tools">
              <span>MikuMikuDance</span><span>PMX Editor</span><span>Blender</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ========= 新人路线 ========= -->
      <section class="section">
        <h2 class="section-title">新人成长路线</h2>
        <div class="roadmap">
          <div class="rm-step" v-for="(step, i) in roadmap" :key="i" :style="{ '--r-i': i }">
            <div class="rm-dot">
              <span class="rm-num">{{ i + 1 }}</span>
            </div>
            <div class="rm-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ========= 加入方式 ========= -->
      <section class="section join-section">
        <h2 class="section-title">加入我们</h2>
        <div class="join-card">
          <div class="join-bg-shapes">
            <div class="js-1"></div><div class="js-2"></div><div class="js-3"></div>
          </div>
          <div class="join-inner">
            <div class="join-qr-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <rect x="28" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <rect x="4" y="28" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <rect x="28" y="28" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="38" y="28" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="28" y="38" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="38" y="38" width="6" height="6" rx="1" fill="currentColor"/>
              </svg>
            </div>
            <div class="join-text">
              <h3>QQ 招新群</h3>
              <p>扫码或搜索群号加入，验证请备注「MAD」或「MMD」</p>
            </div>
            <div class="join-qrcode">
              <div class="qq-number" @click="copyQQ">
                <span class="qq-label">群号</span>
                <span class="qq-value">946548850</span>
                <span class="qq-copy-hint">{{ copied ? '已复制 ✓' : '点击复制' }}</span>
              </div>
              <div class="qq-qr-placeholder" @click="copyQQ">
                <img src="/Assets/视频组QR.jpg" alt="QQ群二维码" class="qr-image" />
                <span class="qr-hint">点击复制群号</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========= FAQ ========= -->
      <section class="section">
        <h2 class="section-title">常见问题</h2>
        <div class="faq-list">
          <details v-for="(faq, i) in faqs" :key="i" class="faq-item" :style="{ '--f-i': i }">
            <summary class="faq-q">
              <span class="faq-icon">Q</span>
              {{ faq.q }}
              <span class="faq-toggle">+</span>
            </summary>
            <div class="faq-a">
              <span class="faq-icon">A</span>
              {{ faq.a }}
            </div>
          </details>
        </div>
      </section>
    </main>

    <!-- 返回顶部 -->
    <button class="scroll-top" @click="scrollToTop" :class="{ visible: showScrollTop }">↑</button>

    <!-- 底部 -->
    <footer class="page-footer">
      <p>柒世纪视频组 · Seventh Century Video Group</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() { router.push('/home') }

const copied = ref(false)
const showScrollTop = ref(false)
const isDark = ref(true)
let scrollHandler = null

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
  scrollHandler = () => {
    showScrollTop.value = window.scrollY > 400
  }
  window.addEventListener('scroll', scrollHandler)
})

onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler)
})

function copyQQ() {
  navigator.clipboard.writeText('946548850').then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = '946548850'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const roadmap = [
  { title: '通用准备', desc: '安装所属方向所需软件，完成环境测试；熟悉社团共享盘结构与命名规范。' },
  { title: '方向选择', desc: '根据兴趣选择 MAD 剪辑或 MMD 三维演出方向，获取对应的训练路径。' },
  { title: '基础训练', desc: 'MAD 方向从剪辑基础到节奏校准；MMD 方向从模型加载到标准工作流。' },
  { title: '深化与创作', desc: '特效合成、光影渲染、赛事准备，逐步产出独立作品。' },
]

const faqs = [
  { q: '没有任何基础可以加入吗？', a: '当然可以。社团提供从零开始的新人训练路径，只要你有热情和耐心，我们可以一起成长。' },
  { q: '需要准备什么软件？', a: 'MAD 方向建议 Premiere Pro 或 DaVinci Resolve；MMD 方向需安装 MikuMikuDance 及 PMX Editor。入群后可在共享盘获取资源包。' },
  { q: '社团活动频率如何？', a: '日常以线上交流为主，定期发布主题企划。成员根据个人节奏参与创作，不强制考勤。' },
  { q: 'MAD 和 MMD 可以都参加吗？', a: '建议选择一条线深耕，但了解另一方向的基础知识有助于跨组协作。公共企划与行政活动面向全员开放。' },
  { q: '加入后有哪些支持？', a: '共享素材库、培训档案、软件安装协助、作品内测反馈与赛事信息同步。' },
]
</script>

<style scoped>
/* ==============================
   社团招新 — 热情·开放·成长
   ============================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.recruit-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
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
    radial-gradient(ellipse at 30% 20%, rgba(15, 155, 142, 0.06) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 80%, rgba(230, 168, 23, 0.05) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(100, 80, 200, 0.04) 0%, transparent 60%);
}

.bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

/* --- 导航 --- */
.top-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 16px 32px;
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
  max-width: 880px;
  margin: 0 auto;
  padding: 100px 24px 40px;
}

/* ========= Hero ========= */
.hero {
  text-align: center;
  padding: 80px 0 50px;
  animation: fadeUp 0.8s ease;
}

.hero-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  padding: 6px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(15, 155, 142, 0.15), rgba(230, 168, 23, 0.1));
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.15);
  margin-bottom: 24px;
  text-transform: uppercase;
  animation: pulseBadge 2s ease-in-out infinite;
}

@keyframes pulseBadge {
  0%, 100% { box-shadow: 0 0 0 0 rgba(15, 155, 142, 0); }
  50% { box-shadow: 0 0 20px 4px rgba(15, 155, 142, 0.06); }
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 20px;
}

.hero-line {
  font-size: 3.8rem;
  font-weight: 800;
  letter-spacing: 6px;
  line-height: 1.15;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--l-i) * 0.15s + 0.2s);
}

.hero-line:nth-child(1) {
  background: linear-gradient(135deg, #0f9b8e 0%, #e6a817 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-line:nth-child(2) {
  color: rgba(255,255,255,0.15);
  font-size: 2rem;
  letter-spacing: 12px;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.4);
  max-width: 540px;
  margin: 0 auto;
}

/* ========= Section ========= */
.section {
  margin-top: 80px;
  animation: fadeUp 0.8s ease backwards;
}
.section:nth-of-type(1) { animation-delay: 0.05s; }
.section:nth-of-type(2) { animation-delay: 0.1s; }
.section:nth-of-type(3) { animation-delay: 0.15s; }
.section:nth-of-type(4) { animation-delay: 0.2s; }
.section:nth-of-type(5) { animation-delay: 0.25s; }
.section:nth-of-type(6) { animation-delay: 0.3s; }

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
  background: linear-gradient(to right, rgba(255,255,255,0.06), transparent);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ========= About ========= */
.about-card {
  padding: 28px 32px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.02);
}

.about-card p {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.55);
  margin: 0 0 16px;
}

.about-card strong {
  color: #0f9b8e;
}

.about-motto {
  font-size: 0.9rem;
  padding: 12px 20px;
  border-radius: 10px;
  background: rgba(15, 155, 142, 0.04);
  border-left: 3px solid rgba(15, 155, 142, 0.3);
  color: rgba(255,255,255,0.4);
  font-style: italic;
}

/* ========= Tracks ========= */
.tracks {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.track-card {
  flex: 1;
  padding: 32px 24px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.track-mad {
  background: linear-gradient(135deg, rgba(230, 100, 50, 0.04), rgba(230, 168, 23, 0.02));
  border: 1px solid rgba(230, 100, 50, 0.06);
}

.track-mmd {
  background: linear-gradient(135deg, rgba(15, 155, 142, 0.04), rgba(60, 120, 200, 0.02));
  border: 1px solid rgba(15, 155, 142, 0.06);
}

.track-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.track-mad .track-glow {
  background: radial-gradient(circle, rgba(230, 168, 23, 0.03) 0%, transparent 60%);
}
.track-mmd .track-glow {
  background: radial-gradient(circle, rgba(15, 155, 142, 0.03) 0%, transparent 60%);
}

.track-card:hover .track-glow { opacity: 1; }
.track-card:hover { transform: translateY(-4px); }

.track-mad:hover {
  border-color: rgba(230, 168, 23, 0.15);
  box-shadow: 0 8px 32px rgba(230, 168, 23, 0.04);
}

.track-mmd:hover {
  border-color: rgba(15, 155, 142, 0.15);
  box-shadow: 0 8px 32px rgba(15, 155, 142, 0.04);
}

.track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.track-badge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}

.track-mad .track-badge { color: #e6a817; }
.track-mmd .track-badge { color: #0f9b8e; }

.track-icon {
  font-size: 1.6rem;
}

.track-card h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
}

.track-card ul {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track-card li {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.45);
  padding-left: 18px;
  position: relative;
  line-height: 1.4;
}

.track-card li::before {
  content: '›';
  position: absolute;
  left: 0;
  font-weight: 700;
  font-size: 1.1rem;
}

.track-mad li::before { color: #e6a817; }
.track-mmd li::before { color: #0f9b8e; }

.track-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.track-tools span {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.track-mad .track-tools span {
  background: rgba(230, 168, 23, 0.06);
  color: rgba(230, 168, 23, 0.6);
  border: 1px solid rgba(230, 168, 23, 0.08);
}

.track-mmd .track-tools span {
  background: rgba(15, 155, 142, 0.06);
  color: rgba(15, 155, 142, 0.6);
  border: 1px solid rgba(15, 155, 142, 0.08);
}

.track-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
}

.td-icon {
  color: rgba(255,255,255,0.06);
  font-size: 0.9rem;
}

/* ========= Roadmap ========= */
.roadmap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.rm-step {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  position: relative;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--r-i) * 0.1s);
}

.rm-step:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 42px;
  bottom: -6px;
  width: 1px;
  background: linear-gradient(to bottom, rgba(15, 155, 142, 0.2), transparent);
}

.rm-dot {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(15, 155, 142, 0.08);
  border: 1px solid rgba(15, 155, 142, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rm-num {
  font-size: 12px;
  font-weight: 700;
  color: #0f9b8e;
  font-family: 'JetBrains Mono', monospace;
}

.rm-content h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #fff;
}

.rm-content p {
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

/* ========= Join Card ========= */
.join-section {
  margin-top: 80px;
}

.join-card {
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(15, 155, 142, 0.06), rgba(230, 168, 23, 0.03));
  border: 1px solid rgba(15, 155, 142, 0.08);
}

.join-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.js-1, .js-2, .js-3 {
  position: absolute;
  border-radius: 50%;
}

.js-1 {
  top: -60px;
  right: -40px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(15, 155, 142, 0.06), transparent);
  animation: shapeDrift 8s ease-in-out infinite;
}

.js-2 {
  bottom: -80px;
  left: -30px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(230, 168, 23, 0.05), transparent);
  animation: shapeDrift 10s ease-in-out infinite reverse;
}

.js-3 {
  top: 40%;
  left: 60%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(100, 80, 200, 0.04), transparent);
  animation: shapeDrift 12s ease-in-out infinite;
}

@keyframes shapeDrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(15px, -15px) scale(1.1); }
}

.join-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 32px;
  gap: 24px;
}

.join-qr-icon {
  color: #0f9b8e;
  opacity: 0.4;
}

.join-text {
  text-align: center;
}

.join-text h3 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #fff;
}

.join-text p {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

.join-qrcode {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

.qq-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 36px;
  border-radius: 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.qq-number:hover {
  border-color: rgba(15, 155, 142, 0.2);
  background: rgba(15, 155, 142, 0.04);
  transform: translateY(-2px);
}

.qq-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.3);
}

.qq-value {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #0f9b8e, #e6a817);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Plus Jakarta Sans', monospace;
}

.qq-copy-hint {
  font-size: 12px;
  color: #0f9b8e;
  opacity: 0.6;
}

/* QR 装饰 */
.qq-qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.qq-qr-placeholder:hover {
  transform: scale(1.03);
}

.qr-image {
  width: 140px;
  height: 140px;
  border-radius: 10px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.qq-qr-placeholder:hover .qr-image {
  transform: scale(1.03);
  box-shadow: 0 4px 20px rgba(15, 155, 142, 0.08);
}

.qr-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
}

/* ========= FAQ ========= */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-item {
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  overflow: hidden;
  transition: border-color 0.3s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(var(--f-i) * 0.08s);
}

.faq-item[open] {
  border-color: rgba(15, 155, 142, 0.12);
}

.faq-q {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  user-select: none;
  list-style: none;
}

.faq-q::-webkit-details-marker { display: none; }
.faq-q::marker { display: none; }

.faq-q .faq-icon {
  font-size: 11px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 155, 142, 0.08);
  color: #0f9b8e;
  flex-shrink: 0;
}

.faq-toggle {
  margin-left: auto;
  font-size: 1.3rem;
  font-weight: 300;
  color: rgba(255,255,255,0.15);
  transition: transform 0.3s ease;
}

.faq-item[open] .faq-toggle {
  transform: rotate(45deg);
}

.faq-a {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0 20px 16px 20px;
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.4);
}

.faq-a .faq-icon {
  font-size: 10px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(230, 168, 23, 0.08);
  color: #e6a817;
  flex-shrink: 0;
}

/* ========= Scroll top ========= */
.scroll-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(8, 8, 26, 0.8);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.3);
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 90;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.scroll-top.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.scroll-top:hover {
  border-color: rgba(15, 155, 142, 0.2);
  color: #0f9b8e;
  background: rgba(15, 155, 142, 0.08);
}

/* ========= Footer ========= */
.page-footer {
  text-align: center;
  padding: 40px 24px;
  border-top: 1px solid rgba(255,255,255,0.03);
  margin-top: 60px;
}

.page-footer p {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.15);
  letter-spacing: 1px;
}

/* ========== Light mode ========== */
.recruit-page.theme-light {
  background: #f5f7fb;
  color: #1d2129;
}
.theme-light .bg-dots {
  background-image: radial-gradient(rgba(0,0,0,0.025) 0.5px, transparent 0.5px);
}
.theme-light .top-nav {
  background: rgba(255,255,255,0.9);
  border-bottom-color: rgba(0,0,0,0.06);
}
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover {
  color: #0f9b8e;
  background: rgba(15,155,142,0.06);
}
.theme-light .hero-desc { color: rgba(0,0,0,0.35); }
.theme-light .about-card {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
}
.theme-light .about-card p { color: rgba(0,0,0,0.5); }
.theme-light .about-motto { color: rgba(0,0,0,0.35); }
.theme-light .section-title::after {
  background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
}
.theme-light .track-card {
  background: rgba(230,100,50,0.02);
  border-color: rgba(230,100,50,0.06);
}
.theme-light .track-mmd {
  background: rgba(15,155,142,0.02);
  border-color: rgba(15,155,142,0.06);
}
.theme-light .track-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.04); }
.theme-light .track-card h3 { color: #1d2129; }
.theme-light .track-card li { color: rgba(0,0,0,0.4); }
.theme-light .join-card {
  background: linear-gradient(135deg, rgba(15,155,142,0.04), rgba(230,168,23,0.02));
  border-color: rgba(15,155,142,0.06);
}
.theme-light .join-text h3 { color: #1d2129; }
.theme-light .join-text p { color: rgba(0,0,0,0.4); }
.theme-light .qq-number {
  background: rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.06);
}
.theme-light .faq-item {
  background: #fff;
  border-color: rgba(0,0,0,0.06);
}
.theme-light .faq-item[open] { border-color: rgba(15,155,142,0.12); }
.theme-light .faq-q { color: rgba(0,0,0,0.6); }
.theme-light .faq-a { color: rgba(0,0,0,0.35); }
.theme-light .scroll-top {
  background: rgba(255,255,255,0.9);
  border-color: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.2);
}
.theme-light .page-footer p { color: rgba(0,0,0,0.08); }

/* ========= Responsive ========= */
@media (max-width: 700px) {
  .hero-line { font-size: 2.4rem; letter-spacing: 4px; }
  .hero-line:nth-child(2) { font-size: 1.4rem; letter-spacing: 8px; }
  .tracks { flex-direction: column; }
  .track-divider { width: 100%; height: 12px; }
  .page-content { padding: 80px 16px 20px; }
  .top-nav { padding: 12px 16px; }
  .qq-value { font-size: 1.6rem; }
  .join-qrcode { flex-direction: column; gap: 16px; }
}
</style>
