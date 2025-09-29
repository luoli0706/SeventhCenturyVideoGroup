<template>
  <div class="member-login-page">
    <!-- 主题切换按钮 -->
    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>
    
    <div class="login-container">
      <div class="login-form">
        <div class="form-header">
          <h2>社团成员登录</h2>
          <p>请输入您的成员账号和密码</p>
        </div>
        
        <a-form :model="form" layout="vertical" @submit="handleLogin">
          <a-form-item label="成员姓名(CN)" required>
            <a-input 
              v-model="form.cn" 
              placeholder="请输入您的成员姓名" 
              size="large"
              :max-length="20"
            />
          </a-form-item>
          
          <a-form-item label="密码" required>
            <a-input-password 
              v-model="form.password" 
              placeholder="请输入密码" 
              size="large"
            />
          </a-form-item>
          
          <a-form-item>
            <div class="checkbox-container">
              <a-checkbox v-model="form.rememberMe">
                记住密码
              </a-checkbox>
            </div>
          </a-form-item>
          
          <a-form-item>
            <a-button 
              type="primary" 
              size="large" 
              :loading="loading"
              @click="handleLogin"
              style="width: 100%;"
            >
              登录
            </a-button>
          </a-form-item>
          
          <div class="form-links">
            <a-button type="text" @click="goToForgotPassword" class="link-button">
              忘记密码？
            </a-button>
            <a-button type="text" @click="goToChangePassword" class="link-button">
              修改密码
            </a-button>
          </div>
        </a-form>
        
        <div class="form-footer">
          <a-space direction="vertical" style="width: 100%;">
            <a-divider>或</a-divider>
            <a-button type="outline" size="large" @click="goToRegister" style="width: 100%;">
              注册新账号
            </a-button>
            <a-button type="text" @click="goBack">
              返回身份选择
            </a-button>
          </a-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ThemeSwitcherIcon from '../components/ThemeSwitcherIcon.vue'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  cn: '',
  password: '',
  rememberMe: false
})

// 定义API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

onMounted(() => {
  // 如果记住了密码，从localStorage加载
  const savedCN = localStorage.getItem('savedCN')
  const savedPassword = localStorage.getItem('savedPassword')
  const rememberMe = localStorage.getItem('rememberMe') === 'true'
  
  if (rememberMe && savedCN && savedPassword) {
    form.cn = savedCN
    form.password = savedPassword
    form.rememberMe = true
  }
})

const handleLogin = async () => {
  if (!form.cn || !form.password) {
    alert('请填写完整的登录信息')
    return
  }
  
  loading.value = true
  
  try {
    const response = await axios.post(`${apiBaseUrl}/api/login`, {
      cn: form.cn,
      password: form.password
    })
    
    const { token, cn, is_member } = response.data
    
    // 保存登录信息
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify({ cn, is_member }))
    localStorage.setItem('userType', 'member')
    
    // 处理记住密码
    if (form.rememberMe) {
      localStorage.setItem('savedCN', form.cn)
      localStorage.setItem('savedPassword', form.password)
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('savedCN')
      localStorage.removeItem('savedPassword')
      localStorage.removeItem('rememberMe')
    }
    
    alert('登录成功！')
    router.push('/home')
    
  } catch (error) {
    const errorMsg = error.response?.data?.error || '登录失败，请重试'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}

const goToChangePassword = () => {
  router.push('/change-password')
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.member-login-page {
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

.login-container {
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

.checkbox-container {
  margin: 16px 0;
}

.form-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 8px;
}

.link-button {
  font-size: 14px !important;
  color: #1890ff !important;
  padding: 4px 8px !important;
}

.link-button:hover {
  color: #40a9ff !important;
}

.arco-form-item {
  margin-bottom: 20px;
}

/* 增强表单字段对比度 */
.arco-input,
.arco-input-password,
.arco-checkbox {
  background-color: #f0f3ff !important;
  border: 2px solid #d1d9e6 !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.arco-input:focus,
.arco-input-password:focus {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.15), 0 4px 12px rgba(24,144,255,0.1) !important;
  background-color: #ffffff !important;
  transform: translateY(-1px);
}

.arco-input:hover,
.arco-input-password:hover {
  border-color: #40a9ff !important;
  background-color: #ffffff !important;
  box-shadow: 0 3px 8px rgba(64, 169, 255, 0.08);
}

.arco-button {
  font-size: 1em;
  border-radius: 8px !important;
}

.arco-button[type="primary"] {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
  transition: all 0.3s ease;
}

.arco-button[type="primary"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(24,144,255,0.4) !important;
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 1.5em;
  }
}

/* 深色主题样式 */
[data-theme="dark"] .member-login-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

[data-theme="dark"] .login-container {
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

[data-theme="dark"] .form-footer a {
  color: #63b3ed;
}

[data-theme="dark"] .form-footer a:hover {
  color: #90cdf4;
}

[data-theme="dark"] .arco-form-item-label {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-form-item-label-col .arco-form-item-label {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-form-item-label-required-symbol {
  color: #f56565 !important;
}

[data-theme="dark"] .arco-input,
[data-theme="dark"] .arco-input-password {
  background-color: #1e2832 !important;
  border-color: #3d4852 !important;
  color: #e2e8f0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .arco-input::placeholder,
[data-theme="dark"] .arco-input-password input::placeholder {
  color: #8795a1 !important;
}

[data-theme="dark"] .arco-input:focus,
[data-theme="dark"] .arco-input-password:focus {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2), 0 4px 12px rgba(99, 179, 237, 0.15) !important;
  transform: translateY(-1px);
}

[data-theme="dark"] .arco-input:hover,
[data-theme="dark"] .arco-input-password:hover {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 3px 8px rgba(99, 179, 237, 0.12);
}

[data-theme="dark"] .arco-checkbox-label {
  color: #cbd5e0 !important;
}

[data-theme="dark"] .arco-button[type="primary"] {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%) !important;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

[data-theme="dark"] .arco-button[type="primary"]:hover {
  box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4) !important;
}

[data-theme="dark"] .arco-icon {
  color: #a0aec0 !important;
}

[data-theme="dark"] .arco-checkbox {
  border-color: #4a5568 !important;
  background-color: #2d3748 !important;
}

[data-theme="dark"] .arco-checkbox-checked .arco-checkbox-icon {
  background-color: #3182ce !important;
  border-color: #3182ce !important;
}

[data-theme="dark"] .checkbox-container .arco-checkbox-label {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .link-button {
  color: #63b3ed !important;
}

[data-theme="dark"] .link-button:hover {
  color: #90cdf4 !important;
}
</style>
