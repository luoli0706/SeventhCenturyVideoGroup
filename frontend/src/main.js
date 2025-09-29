import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import './style.css'

// 初始化主题设置
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('arco-theme')
    localStorage.setItem('theme', 'light') // 默认浅色主题
  }
}

// 在应用启动前初始化主题
initTheme()

createApp(App).use(router).use(ArcoVue).mount('#app')
