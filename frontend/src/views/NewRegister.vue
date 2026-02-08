<template>
  <div class="register-page">
    <div class="theme-toggle">
      <ThemeSwitcherIcon />
    </div>
    <div class="register-container">
      <div class="register-form">
        <div class="form-header">
          <h2>注册社团成员账号</h2>
          <p>请填写以下信息创建您的账号</p>
        </div>
        
        <a-form :model="form" layout="vertical" @submit="handleRegister">
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
              placeholder="请设置密码" 
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="确认密码" required>
            <a-input-password 
              v-model="form.confirmPassword" 
              placeholder="请再次输入密码" 
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="性别">
            <a-select v-model="form.sex" placeholder="请选择性别" size="large" allow-clear>
              <a-option value="男">男</a-option>
              <a-option value="女">女</a-option>
              <a-option value="其他">其他</a-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="职务">
            <a-input 
              v-model="form.position" 
              placeholder="请输入职务" 
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="入学年份">
            <a-input 
              v-model="form.year" 
              placeholder="如：2025" 
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="方向">
            <a-select v-model="form.direction" placeholder="请选择方向" size="large">
              <a-option value="动画">动画</a-option>
              <a-option value="静止系">静止系</a-option>
              <a-option value="三维">三维</a-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="在役状态" required>
            <a-select v-model="form.status" placeholder="请选择在役状态" size="large">
              <a-option value="仍然在役">仍然在役</a-option>
              <a-option value="已退居幕后">已退居幕后</a-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="备注">
            <a-textarea 
              v-model="form.remark" 
              placeholder="选填" 
              size="large"
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
          </a-form-item>
          
          <a-form-item>
            <a-button 
              type="primary" 
              size="large" 
              :loading="loading"
              @click="handleRegister"
              style="width: 100%;"
            >
              注册账号
            </a-button>
          </a-form-item>
        </a-form>
        
        <div class="form-footer">
          <a-space direction="vertical" style="width: 100%;">
            <a-divider>已有账号？</a-divider>
            <a-button type="outline" size="large" @click="goToLogin" style="width: 100%;">
              返回登录页面
            </a-button>
          </a-space>
        </div>
        
        <!-- 自动跳转提示 -->
        <div v-if="registerSuccess" class="success-message">
          <a-alert 
            type="success" 
            :message="`注册成功！${countdown}秒后自动跳转到登录页面`"
            show-icon
          />
          <div style="margin-top: 10px; text-align: center;">
            <a-button type="link" @click="goToLogin">
              立即跳转
            </a-button>
          </div>
        </div>
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
const registerSuccess = ref(false)
const countdown = ref(5)

const form = reactive({
  cn: '',
  password: '',
  confirmPassword: '',
  sex: '',
  position: '',
  year: '',
  direction: '',
  status: '',
  remark: ''
})

const handleRegister = async () => {
  // 表单验证
  if (!form.cn || !form.password || !form.confirmPassword) {
    alert('请填写完整的注册信息')
    return
  }
  
  if (!form.status) {
    alert('请选择在役状态')
    return
  }
  
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  loading.value = true
  
  try {
    await axios.post(apiUrl('/api/register'), {
      cn: form.cn,
      password: form.password,
      sex: form.sex,
      position: form.position,
      year: form.year,
      direction: form.direction,
      status: form.status,
      remark: form.remark
    })
    
    // 注册成功
    registerSuccess.value = true
    
    // 开始倒计时
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        goToLogin()
      }
    }, 1000)
    
  } catch (error) {
    const errorMsg = error.response?.data?.error || '注册失败，请重试'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/member-login')
}
</script>

<style scoped>
.register-page {
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

.register-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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

.success-message {
  margin-top: 20px;
}

.arco-form-item {
  margin-bottom: 20px;
}

/* 增强表单字段对比度 */
.arco-input,
.arco-input-password,
.arco-select,
.arco-textarea {
  background-color: #f0f3ff !important;
  border: 2px solid #d1d9e6 !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.arco-input:focus,
.arco-input-password:focus,
.arco-select:focus,
.arco-textarea:focus {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.15), 0 4px 12px rgba(24,144,255,0.1) !important;
  background-color: #ffffff !important;
  transform: translateY(-1px);
}

.arco-input:hover,
.arco-input-password:hover,
.arco-select:hover,
.arco-textarea:hover {
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
  .register-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 1.5em;
  }
}

/* 深色主题样式 */
[data-theme="dark"] .register-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

[data-theme="dark"] .register-container {
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

[data-theme="dark"] .success-message {
  background-color: rgba(45, 55, 72, 0.9) !important;
  color: #e2e8f0 !important;
  border-color: rgba(99, 179, 237, 0.3) !important;
}

[data-theme="dark"] .arco-input,
[data-theme="dark"] .arco-input-password,
[data-theme="dark"] .arco-select,
[data-theme="dark"] .arco-textarea {
  background-color: #1e2832 !important;
  border-color: #3d4852 !important;
  color: #e2e8f0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .arco-input::placeholder,
[data-theme="dark"] .arco-input-password input::placeholder,
[data-theme="dark"] .arco-textarea::placeholder {
  color: #8795a1 !important;
}

[data-theme="dark"] .arco-input:focus,
[data-theme="dark"] .arco-input-password:focus,
[data-theme="dark"] .arco-select:focus,
[data-theme="dark"] .arco-textarea:focus {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2), 0 4px 12px rgba(99, 179, 237, 0.15) !important;
  transform: translateY(-1px);
}

[data-theme="dark"] .arco-input:hover,
[data-theme="dark"] .arco-input-password:hover,
[data-theme="dark"] .arco-select:hover,
[data-theme="dark"] .arco-textarea:hover {
  border-color: #63b3ed !important;
  background-color: #2a3441 !important;
  box-shadow: 0 3px 8px rgba(99, 179, 237, 0.12);
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

[data-theme="dark"] .arco-button[type="primary"] {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%) !important;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

[data-theme="dark"] .arco-button[type="primary"]:hover {
  box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4) !important;
}

[data-theme="dark"] .arco-select-view-single {
  background-color: #1e2832 !important;
  color: #e2e8f0 !important;
  border-color: #3d4852 !important;
}

[data-theme="dark"] .arco-select-view-selector {
  background-color: #1e2832 !important;
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-select-view-value {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-select-option {
  background-color: #2d3748 !important;
  color: #e2e8f0 !important;
}

[data-theme="dark"] .arco-select-option:hover {
  background-color: #374151 !important;
}

[data-theme="dark"] .arco-select-option.arco-select-option-selected {
  background-color: #3182ce !important;
  color: #ffffff !important;
}

[data-theme="dark"] .arco-icon {
  color: #a0aec0 !important;
}
</style>
