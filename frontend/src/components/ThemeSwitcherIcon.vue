<template>
  <a-button 
    type="text" 
    size="large" 
    @click="toggleTheme"
    class="theme-toggle-btn"
    :title="isDark ? '切换到浅色主题' : '切换到深色主题'"
  >
    <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
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

<style scoped>
.theme-toggle-btn {
  border-radius: 50% !important;
  width: 45px !important;
  height: 45px !important;
  padding: 0 !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.theme-icon {
  font-size: 20px;
  display: inline-block;
  transition: transform 0.3s ease;
}

/* 深色模式下的按钮样式 */
[data-theme="dark"] .theme-toggle-btn {
  background: rgba(45, 55, 72, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #e2e8f0 !important;
}

[data-theme="dark"] .theme-toggle-btn:hover {
  background: rgba(45, 55, 72, 1) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(20deg);
}

/* 深色主题下的样式 */
[arco-theme="dark"] .theme-toggle-btn {
  background: rgba(0, 0, 0, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
</style>
