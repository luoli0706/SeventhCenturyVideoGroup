<template>
  <div class="memory-code-page">
    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>
    
    <div class="memory-container">
      <div class="form-header">
        <h2>备忘码查看</h2>
        <p>今日备忘码信息</p>
      </div>
      
      <div class="code-display" v-if="memoryCode">
        <div class="code-label">今日备忘码：</div>
        <div class="code-value">{{ memoryCode }}</div>
        <div class="code-date">生成日期：{{ codeDate }}</div>
      </div>
      
      <div class="loading-display" v-else-if="loading">
        <a-spin size="large" />
        <p>正在获取备忘码...</p>
      </div>
      
      <div class="error-display" v-else>
        <p>无法获取备忘码信息</p>
      </div>
      
      <div class="form-footer">
        <a-button type="primary" @click="goHome" size="large">
          返回主页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'

const router = useRouter()
const loading = ref(true)
const memoryCode = ref('')
const codeDate = ref('')

onMounted(async () => {
  await fetchMemoryCode()
})

const fetchMemoryCode = async () => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    const response = await axios.get(`${apiBaseUrl}/api/memory-code`)
    
    memoryCode.value = response.data.code
    codeDate.value = response.data.date
  } catch (error) {
    console.error('获取备忘码失败:', error)
  } finally {
    loading.value = false
  }
}

const goHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.memory-code-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.memory-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
}

.form-header {
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 2em;
  color: #333;
  margin-bottom: 10px;
}

.form-header p {
  color: #666;
  font-size: 1em;
}

.code-display {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  border: 2px solid #e2e8f0;
}

.code-label {
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 12px;
  font-weight: 500;
}

.code-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.code-date {
  font-size: 14px;
  color: #718096;
}

.loading-display,
.error-display {
  padding: 40px 20px;
  color: #666;
}

.loading-display p {
  margin-top: 16px;
  font-size: 16px;
}

.form-footer {
  margin-top: 30px;
}

.arco-button[type="primary"] {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
  transition: all 0.3s ease;
  border-radius: 12px !important;
  width: 100%;
}

.arco-button[type="primary"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(24,144,255,0.4) !important;
}

/* 深色主题样式 */
[data-theme="dark"] .memory-code-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

[data-theme="dark"] .memory-container {
  background: rgba(26, 32, 44, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

[data-theme="dark"] .form-header h2 {
  color: #e2e8f0;
}

[data-theme="dark"] .form-header p {
  color: #a0aec0;
}

[data-theme="dark"] .code-display {
  background: #2d3748;
  border-color: #4a5568;
}

[data-theme="dark"] .code-label {
  color: #cbd5e0;
}

[data-theme="dark"] .code-value {
  color: #63b3ed;
}

[data-theme="dark"] .code-date {
  color: #a0aec0;
}

[data-theme="dark"] .loading-display,
[data-theme="dark"] .error-display {
  color: #a0aec0;
}

[data-theme="dark"] .arco-button[type="primary"] {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%) !important;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

[data-theme="dark"] .arco-button[type="primary"]:hover {
  box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4) !important;
}

@media (max-width: 480px) {
  .memory-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 1.5em;
  }
  
  .code-value {
    font-size: 24px;
  }
}
</style>
