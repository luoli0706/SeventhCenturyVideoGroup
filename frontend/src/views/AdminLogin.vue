<template>
  <div class="admin-login-page">
    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>
    
    <div class="admin-container">
      <div class="form-header">
        <h2>管理员验证</h2>
        <p>请输入管理员密码查看备忘码</p>
      </div>
      
      <a-form :model="form" layout="vertical" @submit="handleAdminLogin">
        <a-form-item label="管理员密码" required>
          <a-input-password 
            v-model="form.password" 
            placeholder="请输入管理员密码" 
            size="large"
          />
        </a-form-item>
        
        <a-form-item>
          <a-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleAdminLogin"
            style="width: 100%;"
          >
            验证
          </a-button>
        </a-form-item>
      </a-form>
      
      <div class="form-footer">
        <a-button type="text" @click="goHome">返回主页</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  password: ''
})

const handleAdminLogin = async () => {
  if (!form.password) {
    alert('请输入管理员密码')
    return
  }

  loading.value = true
  
  // 简单的硬编码验证
  if (form.password === 'QiShiJi7776') {
    alert('验证成功！')
    router.push('/memory-code-view')
  } else {
    alert('密码错误，请重试')
  }
  
  loading.value = false
}

const goHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.admin-login-page {
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

.admin-container {
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

.arco-input-password {
  background-color: #f0f3ff !important;
  border: 2px solid #d1d9e6 !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.arco-input-password:focus {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.15), 0 4px 12px rgba(24,144,255,0.1) !important;
  background-color: #ffffff !important;
  transform: translateY(-1px);
}

.arco-input-password:hover {
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
[data-theme="dark"] .admin-login-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

[data-theme="dark"] .admin-container {
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

[data-theme="dark"] .arco-input-password {
  background-color: #1e2832 !important;
  border-color: #3d4852 !important;
  color: #e2e8f0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .arco-input-password input::placeholder {
  color: #8795a1 !important;
}

[data-theme="dark"] .arco-input-password:focus {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2), 0 4px 12px rgba(99, 179, 237, 0.15) !important;
}

[data-theme="dark"] .arco-input-password:hover {
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
  .admin-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 1.5em;
  }
}
</style>
