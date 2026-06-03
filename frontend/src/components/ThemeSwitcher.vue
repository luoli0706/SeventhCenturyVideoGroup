<template>
  <button :class="['theme-toggle', { 'is-dark': isDark }]" @click="toggleTheme" :title="isDark ? '切换浅色主题' : '切换深色主题'">
    <span class="toggle-track">
      <span class="toggle-icon sun">☀</span>
      <span class="toggle-icon moon">☽</span>
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
  padding: 0;
  line-height: 0;
  transition: transform 0.4s ease;
}

.theme-toggle:hover {
  transform: scale(1.15);
}

.theme-toggle:active {
  transform: scale(0.9);
}

.toggle-track {
  position: relative;
  display: flex;
  align-items: center;
  width: 46px;
  height: 22px;
  border-radius: 11px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  padding: 0 3px;
  box-sizing: border-box;
}

.is-dark .toggle-track {
  background: rgba(255,255,255,0.02);
  border-color: rgba(15,155,142,0.08);
}

.toggle-icon {
  font-size: 10px;
  line-height: 1;
  z-index: 1;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.4s ease;
  color: rgba(255,255,255,0.15);
}

.toggle-icon.sun { left: 6px; }
.toggle-icon.moon { right: 6px; }

.is-dark .toggle-icon.sun { color: rgba(255,255,255,0.08); }
.is-dark .toggle-icon.moon { color: rgba(255,255,255,0.3); }

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.04);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.3s ease, border-color 0.3s ease;
}

.is-dark .toggle-thumb {
  transform: translateX(24px);
  background: rgba(15,155,142,0.15);
  border-color: rgba(15,155,142,0.15);
}

/* Light mode */
.theme-light .toggle-track {
  background: rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.03);
}

.theme-light .toggle-icon { color: rgba(0,0,0,0.12); }
.theme-light .is-dark .toggle-icon.sun { color: rgba(0,0,0,0.06); }
.theme-light .is-dark .toggle-icon.moon { color: rgba(0,0,0,0.2); }

.theme-light .toggle-thumb {
  background: rgba(255,255,255,0.8);
  border-color: rgba(0,0,0,0.04);
}

.theme-light .is-dark .toggle-thumb {
  background: rgba(15,155,142,0.2);
  border-color: rgba(15,155,142,0.1);
}
</style>
