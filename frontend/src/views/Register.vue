<template>
  <div class="register-page">
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
              placeholder="请设置密码（至少6位）" 
              size="large"
              :max-length="50"
            />
          </a-form-item>
          
          <a-form-item label="确认密码" required>
            <a-input-password 
              v-model="form.confirmPassword" 
              placeholder="请再次输入密码" 
              size="large"
              :max-length="50"
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
import { apiUrl } from '../utils/apiUrl'

const router = useRouter()
const loading = ref(false)
const registerSuccess = ref(false)
const countdown = ref(5)

const form = reactive({
  cn: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  // 表单验证
  if (!form.cn || !form.password || !form.confirmPassword) {
    alert('请填写完整的注册信息')
    return
  }
  
  if (form.password.length < 6) {
    alert('密码长度至少6位')
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
      password: form.password
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
}

.register-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 400px;
  width: 100%;
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

.arco-button {
  font-size: 1em;
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
</style>

const router = useRouter()
const form = reactive({
  cn: '',
  gender: '',
  position: '',
  year: '',
  direction: '',
  status: '', // 新增字段
  remark: ''
})

function goBack() {
  router.push('/members')
}

async function handleSubmit() {
  try {
    await axios.post(apiUrl('/api/club_members'), {
      CN: form.cn,
      Sex: form.gender,
      Position: form.position,
      Year: form.year,
      Direction: form.direction,
      Status: form.status,
      Remark: form.remark
    })
    router.push('/members')
  } catch (e) {
    alert('提交失败')
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
</style>