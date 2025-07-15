<template>
  <a-button @click="toggleTheme" style="margin-bottom: 24px;">
    切换{{ isDark ? '浅色' : '深色' }}主题
  </a-button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
}

onMounted(() => {
  // 保证刷新后主题一致
  if (document.body.getAttribute('arco-theme') === 'dark') {
    isDark.value = true
  }
})
</script>