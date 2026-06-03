<template>
  <div class="title-block">
    <h1 class="site-title">柒世纪视频组</h1>
    <p class="site-subtitle">Seventh Century Video Group <span class="sub-sep">—</span> MAD·MMD 创作研究</p>
  </div>
</template>

<style scoped>
.title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.site-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 8px;
  margin: 0;
  font-family: 'Maple Mono', 'Plus Jakarta Sans', sans-serif;
  background: linear-gradient(135deg, rgba(15,155,142,0.7) 0%, rgba(230,168,23,0.7) 40%, rgba(15,155,142,0.7) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 8s ease-in-out infinite;
  line-height: 1.3;
  transition: filter 0.5s ease;
}

.site-subtitle {
  margin: 12px 0 0;
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: rgba(100, 100, 130, 0.35);
  font-weight: 400;
  transition: color 0.3s ease;
}

.sub-sep {
  margin: 0 6px;
  opacity: 0.4;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% center; }
  50%      { background-position: 100% center; }
}
</style>
