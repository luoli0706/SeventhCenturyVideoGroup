<template>
  <div class="login-choice-page">
    <div class="choice-container">
      <div class="title">
        <h1>欢迎来到柒世纪视频组</h1>
        <p>请选择您的身份</p>
      </div>
      
      <div class="choice-buttons">
        <div class="choice-item">
          <div class="choice-icon">👥</div>
          <h3>访客登录</h3>
          <p>浏览基本信息，查看公开内容</p>
          <a-button type="primary" size="large" @click="guestLogin">
            访客身份进入
          </a-button>
        </div>
        
        <div class="choice-item">
          <div class="choice-icon">🎬</div>
          <h3>社团成员登录</h3>
          <p>完整功能权限，管理社团事务</p>
          <a-button type="primary" size="large" @click="memberLogin">
            成员身份登录
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const guestLogin = () => {
  // 设置访客身份
  localStorage.setItem('userType', 'guest')
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  
  // 跳转到首页
  router.push('/home')
}

const memberLogin = () => {
  // 跳转到成员登录页面
  router.push('/member-login')
}
</script>

<style scoped>
.login-choice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.choice-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 800px;
  width: 100%;
}

.title {
  text-align: center;
  margin-bottom: 40px;
}

.title h1 {
  font-size: 2.5em;
  color: #333;
  margin-bottom: 10px;
}

.title p {
  font-size: 1.2em;
  color: #666;
}

.choice-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.choice-item {
  text-align: center;
  padding: 30px 20px;
  border: 2px solid #e8eaed;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%);
}

.choice-item:hover {
  border-color: #1890ff;
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(24,144,255,0.15);
  background: linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%);
}

.choice-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.choice-item h3 {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 10px;
}

.choice-item p {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.6;
}

.arco-btn {
  width: 100%;
  height: 45px;
  font-size: 1.1em;
  border-radius: 8px !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

.choice-item .arco-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
}

.choice-item .arco-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24,144,255,0.4) !important;
}

@media (max-width: 768px) {
  .choice-buttons {
    grid-template-columns: 1fr;
  }
  
  .choice-container {
    padding: 30px 20px;
  }
  
  .title h1 {
    font-size: 2em;
  }
}
</style>
