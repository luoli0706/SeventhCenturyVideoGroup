<template>
  <div class="forgot-password-page">
    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>
    
    <div class="forgot-container">
      <div class="form-header">
        <h2>忘记密码</h2>
        <p>请输入备忘码来重置您的密码</p>
      </div>
      
      <a-form :model="form" layout="vertical" @submit="handleForgotPassword">
        <a-form-item label="成员姓名(CN)" required>
          <a-input 
            v-model="form.cn" 
            placeholder="请输入您的成员姓名" 
            size="large"
          />
        </a-form-item>
        
        <a-form-item label="备忘码" required>
          <a-input 
            v-model="form.memoryCode" 
            placeholder="请输入备忘码" 
            size="large"
          />
        </a-form-item>
        
        <a-form-item>
          <a-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleForgotPassword"
            style="width: 100%;"
          >
            重置密码
          </a-button>
        </a-form-item>
      </a-form>
      
      <div class="form-footer">
        <a-button type="text" @click="goBack">返回登录</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'
import { apiUrl } from '../utils/apiUrl'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  cn: '',
  memoryCode: ''
})

const handleForgotPassword = async () => {
  if (!form.cn || !form.memoryCode) {
    alert('请填写所有必填项')
    return
  }

  loading.value = true
  try {
    const response = await axios.post(apiUrl('/api/forgot-password'), {
      cn: form.cn,
      memory_code: form.memoryCode
    })
    
    alert('密码已重置为 0721，请使用新密码登录')
    router.push('/member-login')
    
  } catch (error) {
    const errorMsg = error.response?.data?.error || '重置失败，请检查备忘码是否正确'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/member-login')
}
</script>

<style scoped>
.forgot-password-page {
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

.forgot-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.form-header {
  text-align: center;
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

.form-footer {
  margin-top: 20px;
  text-align: center;
}

.arco-form-item {
  margin-bottom: 20px;
}

.arco-input {
  background-color: #f0f3ff !important;
  border: 2px solid #d1d9e6 !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.arco-input:focus {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.15), 0 4px 12px rgba(24,144,255,0.1) !important;
  background-color: #ffffff !important;
  transform: translateY(-1px);
}

.arco-input:hover {
  border-color: #40a9ff !important;
  background-color: #ffffff !important;
  box-shadow: 0 3px 8px rgba(64, 169, 255, 0.08);
}

.arco-button[type="primary"] {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
  transition: all 0.3s ease;
  border-radius: 12px !important;
}

.arco-button[type="primary"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(24,144,255,0.4) !important;
}

/* 深色主题样式 */
[data-theme="dark"] .forgot-password-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

[data-theme="dark"] .forgot-container {
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

[data-theme="dark"] .form-footer {
  color: #e2e8f0;
}

[data-theme="dark"] .arco-form-item-label {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-input {
  background-color: #1e2832 !important;
  border-color: #3d4852 !important;
  color: #e2e8f0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .arco-input::placeholder {
  color: #8795a1 !important;
}

[data-theme="dark"] .arco-input:focus {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2), 0 4px 12px rgba(99, 179, 237, 0.15) !important;
}

[data-theme="dark"] .arco-input:hover {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 3px 8px rgba(99, 179, 237, 0.12);
}

[data-theme="dark"] .arco-button[type="primary"] {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%) !important;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

[data-theme="dark"] .arco-button[type="primary"]:hover {
  box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4) !important;
}

@media (max-width: 480px) {
  .forgot-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 1.5em;
  }
}
</style>
