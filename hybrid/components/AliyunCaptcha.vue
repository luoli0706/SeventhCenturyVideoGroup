<template>
  <div class="aliyun-captcha-wrapper">
    <div id="aliyun-captcha-element"></div>
    <button
      class="captcha-btn"
      :id="buttonId"
      :disabled="loading"
    >
      {{ loading ? '加载验证...' : '点击完成人机验证' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  sceneId: string
  prefix: string
}>()

const emit = defineEmits<{
  verify: [captchaVerifyParam: string]
}>()

const loading = ref(false)
const buttonId = 'aliyun-captcha-btn'

onMounted(async () => {
  ;(window as any).AliyunCaptchaConfig = {
    region: 'cn',
    prefix: props.prefix,
  }

  loading.value = true
  try {
    await loadScript()
    ;(window as any).initAliyunCaptcha({
      SceneId: props.sceneId,
      mode: 'popup',
      button: `#${buttonId}`,
      success: (captchaVerifyParam: string) => {
        emit('verify', captchaVerifyParam)
      },
      fail: () => {
        // Aliyun handles retry internally; do nothing
      },
    })
  } finally {
    loading.value = false
  }
})

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).initAliyunCaptcha) return resolve()
    const s = document.createElement('script')
    s.src = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}
</script>

<style scoped>
.aliyun-captcha-wrapper {
  display: flex;
  justify-content: center;
  min-height: 44px;
}
.captcha-btn {
  padding: 10px 32px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.35);
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.captcha-btn:hover:not(:disabled) {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.15);
  color: rgba(15,155,142,0.5);
}
.captcha-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
