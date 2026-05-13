<template>
  <button :class="['theme-toggle', { 'is-dark': isDark }]" @click="toggleTheme" :title="isDark ? '切换浅色主题' : '切换深色主题'">
    <span class="toggle-track">
      <span class="toggle-icon sun">☀️</span>
      <span class="toggle-icon moon">🌙</span>
      <span class="toggle-thumb"></span>
    </span>
  </button>
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
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('arco-theme', 'dark')
  }
})
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  margin-bottom: 20px;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.toggle-track {
  position: relative;
  display: flex;
  align-items: center;
  width: 54px;
  height: 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e8ecf4, #dce2ee);
  border: 1px solid #d0d5e0;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 4px;
  box-sizing: border-box;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
}

.is-dark .toggle-track {
  background: linear-gradient(135deg, #16162a, #1a1a30);
  border-color: rgba(15, 155, 142, 0.25);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3), 0 0 12px rgba(15, 155, 142, 0.06);
}

.toggle-icon {
  font-size: 12px;
  line-height: 1;
  z-index: 1;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
}

.toggle-icon.sun {
  left: 7px;
  opacity: 1;
  filter: grayscale(0);
}

.toggle-icon.moon {
  right: 7px;
  opacity: 0.3;
  filter: grayscale(0.5);
}

.is-dark .toggle-icon.sun {
  opacity: 0.3;
  filter: grayscale(0.5);
}

.is-dark .toggle-icon.moon {
  opacity: 1;
  filter: grayscale(0);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, box-shadow 0.3s ease;
}

.is-dark .toggle-thumb {
  transform: translateX(24px);
  background: #0f9b8e;
  box-shadow: 0 1px 6px rgba(15, 155, 142, 0.35);
}
</style>
