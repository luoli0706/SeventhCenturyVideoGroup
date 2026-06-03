<template>
  <div class="verify-page">
    <div class="bg-layer">
      <div class="bg-glow"></div>
      <div class="bg-dots"></div>
    </div>

    <main class="verify-content">
      <div class="verify-card" v-if="!verified">
        <div class="verify-brand">
          <div class="verify-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="currentColor" stroke-width="1.2"/>
              <path d="M10 14l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="verify-title">人机验证</h1>
          <p class="verify-desc">请完成验证后进入站点</p>
        </div>

        <div class="verify-body">
          <div v-if="!sceneId" class="verify-error">
            <p>验证服务暂未配置</p>
            <a href="/login-choice" class="verify-skip">跳过验证进入 →</a>
          </div>
          <div v-else class="verify-widget">
            <AliyunCaptcha :scene-id="sceneId" :prefix="prefix" @verify="onToken" />
            <p v-if="verifying" class="verify-checking">验证中...</p>
          </div>
        </div>
      </div>

      <div class="verify-card verify-done" v-else>
        <div class="verify-success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="1.5"/>
            <path d="M16 24l6 6 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="verify-title">验证通过</h1>
        <p class="verify-desc">即将跳转...</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const config = useRuntimeConfig()
const sceneId = computed(() => (config.public.aliyunCaptchaSceneId as string) || '')
const prefix = computed(() => (config.public.aliyunCaptchaPrefix as string) || '')
const verified = ref(false)
const verifying = ref(false)

async function onToken(captchaVerifyParam: string) {
  if (!captchaVerifyParam || verified.value) return
  verifying.value = true
  try {
    const res = await $fetch('/api/turnstile-verify', {
      method: 'POST',
      body: { captchaVerifyParam, sceneId: sceneId.value }
    })
    if ((res as any).success) {
      verified.value = true
      if (import.meta.client) {
        sessionStorage.setItem('scvg_verified', 'true')
      }
      setTimeout(() => {
        window.location.href = '/login-choice'
      }, 800)
    }
  } catch {
    // verification failed
  } finally {
    verifying.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    // Check session AFTER hydration to avoid SSR/CSR mismatch
    if (sessionStorage.getItem('scvg_verified') === 'true') {
      window.location.href = '/login-choice'
    }
  }
})
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  background: #08081a;
  color: rgba(255,255,255,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-glow {
  position: absolute;
  top: -20%; left: -10%;
  width: 600px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,155,142,0.04) 0%, transparent 70%);
  filter: blur(120px);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 56px 56px;
}

.verify-content {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  padding: 24px;
  animation: fadeUp 0.6s ease;
}

.verify-card {
  background: rgba(255,255,255,0.01);
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 20px;
  padding: 48px 32px 40px;
  text-align: center;
}
.verify-done {
  animation: fadeUp 0.4s ease;
}

.verify-brand {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  margin-bottom: 32px;
}
.verify-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(15,155,142,0.06);
  border: 1px solid rgba(15,155,142,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,155,142,0.35);
}
.verify-title {
  font-size: 1.4rem; font-weight: 700; letter-spacing: 3px;
  margin: 0; color: rgba(255,255,255,0.5);
}
.verify-desc {
  font-size: 0.85rem; letter-spacing: 1px;
  color: rgba(255,255,255,0.2); margin: 0;
}

.verify-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80px;
}
.verify-widget {
  transform: scale(0.9);
  transform-origin: center;
}
.verify-checking {
  font-size: 12px; letter-spacing: 2px;
  color: rgba(255,255,255,0.1);
  margin-top: 8px;
}
.verify-error {
  color: rgba(255,255,255,0.2);
  font-size: 13px;
}
.verify-skip {
  display: inline-block;
  margin-top: 12px;
  color: rgba(15,155,142,0.25);
  text-decoration: none;
  font-size: 12px; letter-spacing: 1px;
  transition: color 0.2s;
}
.verify-skip:hover { color: rgba(15,155,142,0.5); }

.verify-success-icon {
  color: rgba(15,155,142,0.25);
  margin-bottom: 16px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
