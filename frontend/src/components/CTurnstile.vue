<template>
  <div ref="wrapRef" class="turnstile-widget"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  siteKey: String
})

const emit = defineEmits(['verify', 'expired'])
const wrapRef = ref(null)
let widgetId = null

function loadScript() {
  return new Promise((resolve) => {
    if (window.turnstile) return resolve()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  if (!props.siteKey) return
  await loadScript()
  widgetId = window.turnstile.render(wrapRef.value, {
    sitekey: props.siteKey,
    callback: (token) => emit('verify', token),
    'expired-callback': () => emit('expired')
  })
})
</script>

<style scoped>
.turnstile-widget {
  display: flex;
  justify-content: center;
  min-height: 70px;
}
</style>
