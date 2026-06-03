<template>
  <div class="home-page">
    <!-- Loading Overlay: CSS-animated, auto-hides -->
    <div class="loader-overlay" id="pageLoader">
      <div class="loader-inner">
        <div class="loader-bar"></div>
        <div class="loader-brand">柒世纪视频组</div>
      </div>
    </div>

    <div class="bg-layer">
      <div class="bg-glow top-left"></div>
      <div class="bg-glow bottom-right"></div>
      <div class="bg-dots"></div>
    </div>

    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-badge">MAD · MMD 创作研究</div>
      <h1 class="hero-title">柒世纪视频组</h1>
      <p class="hero-subtitle">Seventh Century Video Group</p>

      <div class="hero-stats" v-if="memberCount !== null">
        <div class="stat-item">
          <span class="stat-num">{{ memberCount }}</span>
          <span class="stat-label">成员</span>
        </div>
        <span class="stat-dot"></span>
        <div class="stat-item">
          <span class="stat-num">3</span>
          <span class="stat-label">系别</span>
        </div>
        <span class="stat-dot"></span>
        <div class="stat-item">
          <span class="stat-num">{{ eventCount }}</span>
          <span class="stat-label">活动</span>
        </div>
      </div>

      <div class="hero-actions">
        <a href="/verify" class="btn-primary">进入站点 <span class="btn-arrow">→</span></a>
        <a href="/recruit" class="btn-secondary">加入我们</a>
      </div>
    </section>

    <!-- About -->
    <section class="about-section">
      <div class="section-divider"><span class="divider-line"></span><span class="divider-sym">◆</span><span class="divider-line"></span></div>
      <h2 class="section-title">关于社团</h2>
      <div class="about-body">
        <p class="about-text">柒世纪视频组成立于 2023 年，是一个专注于 <strong>MAD</strong>（音乐动画视频）与 <strong>MMD</strong>（MikuMikuDance 三维动画）创作研究的学生社团。</p>
        <p class="about-text">我们相信每一帧画面都承载着创作者的灵魂。无论你是动画师、静态视觉设计师还是三维建模师，这里都有属于你的舞台。</p>
      </div>
      <div class="about-motto">
        <span class="motto-mark">"</span>
        <p class="motto-text">以帧为笔，以光为墨</p>
        <span class="motto-mark">"</span>
      </div>
    </section>

    <!-- Departments -->
    <section class="dept-section">
      <div class="section-divider"><span class="divider-line"></span><span class="divider-sym">◇</span><span class="divider-line"></span></div>
      <h2 class="section-title">创作方向</h2>
      <div class="dept-grid">
        <div class="dept-card">
          <div class="dept-icon-wrap"><span class="dept-icon">▣</span></div>
          <h3 class="dept-name">动画系</h3>
          <p class="dept-desc">帧与帧之间，创造流动的叙事。用节奏与剪辑讲述无法用言语表达的故事。</p>
          <span class="dept-tag">Animation</span>
        </div>
        <div class="dept-card">
          <div class="dept-icon-wrap"><span class="dept-icon">◈</span></div>
          <h3 class="dept-name">静止系</h3>
          <p class="dept-desc">在静止的画面中，捕捉永恒的美学。每一帧独立成画，帧帧皆为壁纸。</p>
          <span class="dept-tag">Static Graphics</span>
        </div>
        <div class="dept-card">
          <div class="dept-icon-wrap"><span class="dept-icon">◉</span></div>
          <h3 class="dept-name">三维</h3>
          <p class="dept-desc">以数字构建空间，用光影塑造真实。从模型到渲染，创造属于你的三维世界。</p>
          <span class="dept-tag">3D Graphics</span>
        </div>
      </div>
    </section>

      <!-- Featured -->
    <section class="featured-section">
      <div class="section-divider"><span class="divider-line"></span><span class="divider-sym">◇</span><span class="divider-line"></span></div>
      <h2 class="section-title">社团活动</h2>
      <div class="featured-grid" v-if="events.length > 0">
        <div class="featured-item" v-for="ev in events.slice(0, 4)" :key="ev.ID">
          <div class="featured-meta">{{ ev.Time }}</div>
          <h3 class="featured-name">{{ ev.Name }}</h3>
          <p class="featured-desc">{{ ev.Detail || '暂无描述' }}</p>
        </div>
      </div>
      <div class="featured-empty" v-else>
        <p class="featured-empty-text">暂无活动记录</p>
        <p class="featured-empty-sub">活动发布后将在此展示</p>
      </div>
      <a href="/events" class="featured-link">查看全部活动 →</a>
    </section>

    <!-- Final CTA -->
    <section class="cta-section">
      <div class="section-divider"><span class="divider-line"></span><span class="divider-sym">◆</span><span class="divider-line"></span></div>
      <p class="cta-text">准备好开始创作了吗？</p>
      <div class="cta-actions">
        <a href="/verify" class="btn-primary btn-large">进入站点 <span class="btn-arrow">→</span></a>
        <a href="/recruit" class="btn-outline">加入我们</a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="page-footer">
      <p class="footer-copy">柒世纪视频组 · Seventh Century Video Group</p>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="footer-beian">闽ICP备2025101374号</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { data: members } = await useFetch('/api/club_members', {
  baseURL: 'http://localhost:7777',
  server: true,
  onResponseError: () => {}
})

const { data: activities } = await useFetch('/api/activities', {
  baseURL: 'http://localhost:7777',
  server: true,
  onResponseError: () => {}
})

const memberCount = ref<number | null>(null)
const eventCount = ref<number | null>(null)
const events = ref<any[]>([])

if (members.value && Array.isArray(members.value)) {
  memberCount.value = members.value.length
}
if (activities.value && Array.isArray(activities.value)) {
  events.value = activities.value
  eventCount.value = activities.value.length
} else {
  eventCount.value = 0
}



onMounted(() => {
  const el = document.getElementById('pageLoader')
  if (el) {
    setTimeout(() => el.style.display = 'none', 1200)
  }
})
</script>

<style scoped>
/* ═══════ Loading Overlay ═══════ */
.loader-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: #08081a;
  animation: loaderFade 0.45s ease 0.7s forwards;
}
.loader-done { display: none; }

.loader-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.loader-bar {
  width: 80px; height: 2px;
  background: rgba(255,255,255,0.03);
  border-radius: 1px;
  overflow: hidden;
}
.loader-bar::after {
  content: '';
  display: block;
  width: 0; height: 100%;
  background: linear-gradient(90deg, rgba(15,155,142,0.3), rgba(230,168,23,0.2));
  border-radius: 1px;
  animation: loaderFill 0.55s ease-out forwards;
}

.loader-brand {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 5px;
  color: rgba(255,255,255,0.06);
}

@keyframes loaderFill {
  0% { width: 0; }
  100% { width: 100%; }
}
@keyframes loaderFade {
  to { opacity: 0; visibility: hidden; }
}

/* ═══════ Background ═══════ */
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}
.bg-glow.top-left {
  top: -10%; left: -5%;
  width: 600px; height: 400px;
  background: radial-gradient(circle, rgba(15,155,142,0.04) 0%, transparent 70%);
}
.bg-glow.bottom-right {
  bottom: -10%; right: -5%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(230,168,23,0.03) 0%, transparent 70%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 56px 56px;
}

/* ═══════ Base ═══════ */
.home-page {
  min-height: 100vh;
  background: #08081a;
  color: rgba(255,255,255,0.75);
  position: relative;
  overflow-x: hidden;
}
section {
  position: relative; z-index: 1;
  max-width: 600px; margin: 0 auto;
  padding: 0 24px;
}

/* ═══════ Section Divider ═══════ */
.section-divider {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-bottom: 20px;
}
.divider-line { width: 48px; height: 1px; background: rgba(255,255,255,0.04); }
.divider-sym { font-size: 7px; color: rgba(255,255,255,0.05); }
.section-title {
  font-size: 1.1rem; font-weight: 700; letter-spacing: 5px;
  text-align: center; margin: 0 0 24px;
  color: rgba(255,255,255,0.4);
}

/* ═══════ Hero ═══════ */
.hero-section {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 64px 24px 32px;
}

.hero-badge {
  font-size: 9px; font-weight: 600; letter-spacing: 4px;
  color: rgba(255,255,255,0.35);
  margin-bottom: 16px; padding: 4px 14px;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 20px; text-transform: uppercase;
}

.hero-title {
  font-size: 2.8rem; font-weight: 800; letter-spacing: 10px;
  margin: 0 0 8px; line-height: 1.15;
  background: linear-gradient(135deg, #0f9b8e, rgba(230,168,23,0.7));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 0.7rem; letter-spacing: 8px; text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  margin: 0 0 28px; font-weight: 300;
}

.hero-stats {
  display: flex; align-items: center; justify-content: center;
  gap: 24px; margin-bottom: 28px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stat-num {
  font-size: 1.5rem; font-weight: 700; letter-spacing: 2px; line-height: 1;
  color: rgba(255,255,255,0.55);
}
.stat-label {
  font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(255,255,255,0.15);
}
.stat-dot { width: 2px; height: 2px; border-radius: 50%; background: rgba(255,255,255,0.08); }

.hero-actions {
  display: flex; gap: 14px; justify-content: center; margin-bottom: 0;
}

.hero-scroll-hint {
  display: flex; flex-direction: column; align-items: center;
  opacity: 0.15; animation: scrollBounce 2.5s ease-in-out infinite;
}
.scroll-line {
  width: 1px; height: 28px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.08), transparent);
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

/* ═══════ Buttons ═══════ */
.btn-primary, .btn-secondary, .btn-outline {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 30px; border-radius: 8px;
  font-size: 13px; font-weight: 600; letter-spacing: 1.5px;
  text-decoration: none; transition: all 0.3s ease; font-family: inherit;
}
.btn-primary {
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  color: rgba(15,155,142,0.65);
}
.btn-primary:hover {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.12);
  color: #0f9b8e; transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.35);
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5); transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.2);
}
.btn-outline:hover {
  border-color: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.35); transform: translateY(-1px);
}
.btn-large { padding: 15px 38px; font-size: 14px; }

/* ═══════ About ═══════ */
.about-section { padding-bottom: 24px; }
.about-body { max-width: 460px; margin: 0 auto; }
.about-text {
  font-size: 0.85rem; line-height: 2; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 14px; text-align: center;
}
.about-text strong { color: rgba(255,255,255,0.6); font-weight: 600; }

.about-motto {
  display: flex; flex-direction: column; align-items: center;
  margin-top: 28px;
}
.motto-mark { font-size: 1.8rem; line-height: 0.3; color: rgba(15,155,142,0.08); }
.motto-text {
  font-size: 1rem; font-weight: 300; letter-spacing: 5px;
  color: rgba(255,255,255,0.25);
  margin: 6px 0;
}

/* ═══════ Departments ═══════ */
.dept-section { padding-bottom: 24px; }
.dept-grid { display: flex; flex-direction: column; gap: 14px; }

.dept-card {
  display: flex; flex-direction: column;
  padding: 24px 24px 20px;
  border-radius: 12px;
  background: rgba(255,255,255,0.01);
  border: 1px solid rgba(255,255,255,0.02);
  transition: all 0.35s ease;
}
.dept-card:hover {
  background: rgba(255,255,255,0.015);
  border-color: rgba(15,155,142,0.04);
  transform: translateX(3px);
}

.dept-icon-wrap {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
  border-radius: 8px;
  background: rgba(255,255,255,0.01);
  border: 1px solid rgba(255,255,255,0.02);
}
.dept-icon {
  font-size: 1rem; line-height: 1;
  color: rgba(15,155,142,0.2);
  transition: color 0.35s ease;
}
.dept-card:hover .dept-icon { color: rgba(15,155,142,0.35); }

.dept-name {
  font-size: 1rem; font-weight: 600; letter-spacing: 2px;
  margin: 0 0 6px; color: rgba(255,255,255,0.4);
}
.dept-desc {
  font-size: 0.8rem; line-height: 1.7; letter-spacing: 0.2px;
  color: rgba(255,255,255,0.35);
  margin: 0 0 12px;
}
.dept-tag {
  font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
  color: rgba(15,155,142,0.15);
}

/* ═══════ Featured ═══════ */
.featured-section { padding-bottom: 24px; }
.featured-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; margin-bottom: 24px;
}

.featured-item {
  padding: 22px 20px;
  border-radius: 10px;
  background: rgba(255,255,255,0.008);
  border: 1px solid rgba(255,255,255,0.02);
  transition: all 0.35s ease;
}
.featured-item:hover {
  background: rgba(255,255,255,0.012);
  border-color: rgba(230,168,23,0.04);
  transform: translateY(-1px);
}
.featured-meta {
  font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
  color: rgba(230,168,23,0.2);
  margin-bottom: 8px;
}
.featured-name {
  font-size: 0.9rem; font-weight: 600; letter-spacing: 1px;
  margin: 0 0 5px; color: rgba(255,255,255,0.4);
}
.featured-desc {
  font-size: 0.75rem; line-height: 1.5;
  color: rgba(255,255,255,0.3); margin: 0;
}
.featured-empty {
  text-align: center; padding: 28px 20px;
  border-radius: 10px;
  background: rgba(255,255,255,0.008);
  border: 1px dashed rgba(255,255,255,0.03);
  margin-bottom: 24px;
}
.featured-empty-text {
  font-size: 0.85rem; color: rgba(255,255,255,0.2); margin: 0 0 4px;
}
.featured-empty-sub {
  font-size: 0.75rem; color: rgba(255,255,255,0.1); margin: 0;
}
.featured-link {
  font-size: 12px; font-weight: 500; letter-spacing: 1px;
  color: rgba(15,155,142,0.15);
  text-decoration: none; transition: color 0.3s ease;
}
.featured-link:hover { color: rgba(15,155,142,0.3); }

/* ═══════ CTA ═══════ */
.cta-section { padding-bottom: 24px; text-align: center; }
.cta-text {
  font-size: 0.95rem; font-weight: 300; letter-spacing: 4px;
  color: rgba(255,255,255,0.25);
  margin: 0 0 24px;
}
.cta-actions { display: flex; gap: 14px; justify-content: center; }

/* ═══════ Footer ═══════ */
.page-footer {
  position: relative; z-index: 1;
  max-width: 600px; margin: 0 auto;
  padding: 24px; text-align: center;
  display: flex; flex-direction: column; gap: 4px;
}
.footer-copy {
  font-size: 10px; letter-spacing: 2px;
  color: rgba(255,255,255,0.06); margin: 0;
}
.footer-beian {
  font-size: 10px; letter-spacing: 1px;
  color: rgba(255,255,255,0.04);
  text-decoration: none; transition: color 0.3s ease;
}
.footer-beian:hover { color: rgba(255,255,255,0.1); }

/* ═══════ Responsive ═══════ */
@media (max-width: 480px) {
  .hero-title { font-size: 2.2rem; letter-spacing: 8px; }
  .hero-subtitle { letter-spacing: 6px; margin-bottom: 24px; }
  .hero-stats { gap: 16px; margin-bottom: 24px; }
  .stat-num { font-size: 1.4rem; }
  .hero-actions { flex-direction: column; align-items: center; gap: 10px; }

  section { padding: 0 20px; }
  .about-section, .dept-section, .featured-section { padding-bottom: 20px; }
  .section-title { font-size: 1rem; margin-bottom: 20px; }

  .dept-card { padding: 18px 16px; }
  .featured-grid { grid-template-columns: 1fr; }
  .featured-item { padding: 16px 14px; }

  .cta-section { padding-bottom: 20px; }
  .cta-actions { flex-direction: column; align-items: center; gap: 10px; }
  .btn-large, .btn-outline { width: 100%; justify-content: center; }
}
</style>
