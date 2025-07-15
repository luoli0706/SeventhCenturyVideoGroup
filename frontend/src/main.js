import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import './style.css'

document.body.setAttribute('arco-theme', 'dark') // 默认深色

createApp(App).use(router).use(ArcoVue).mount('#app')
