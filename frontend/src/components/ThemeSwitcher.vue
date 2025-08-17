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
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('arco-theme')
  }
  
  // 保存主题设置到localStorage
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  // 从localStorage读取保存的主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    isDark.value = false
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('arco-theme')
  }
})
</script>