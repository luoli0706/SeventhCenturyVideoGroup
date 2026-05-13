<template>
  <div class="title-block">
    <h1 class="site-title">柒世纪视频组</h1>
    <p class="site-subtitle">Seventh Century Video Group — MAD·MMD 创作研究</p>
  </div>
</template>

<style scoped>
.title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.site-title {
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: 4px;
  margin: 0;
  background: linear-gradient(135deg, #165dff 0%, #0f9b8e 45%, #e6a817 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleShimmer 5s ease-in-out infinite;
  line-height: 1.2;
  text-shadow: none;
  filter: drop-shadow(0 0 0 transparent);
  transition: filter 0.5s ease;
}

.site-subtitle {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 1px;
  color: rgba(100, 100, 130, 0.6);
  font-weight: 400;
  transition: color 0.3s ease;
}

@keyframes titleShimmer {
  0%, 100% { background-position: 0% center; }
  50%      { background-position: 100% center; }
}
</style>
