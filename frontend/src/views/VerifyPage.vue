<template>
  <div class="verify-page">
    <div class="verify-container">
      <div class="verify-header">
        <h1>🛡️ 安全验证</h1>
        <p>为了保护网站安全，请完成以下验证</p>
      </div>

      <div class="verify-content">
        <!-- Cloudflare Turnstile Widget -->
        <div class="turnstile-widget">
          <div 
            ref="turnstileRef" 
            :data-sitekey="siteKey"
            data-theme="auto"
            data-callback="onTurnstileCallback"
            data-error-callback="onTurnstileError"
            data-expired-callback="onTurnstileExpired"
            data-timeout-callback="onTurnstileTimeout"
          ></div>
        </div>

        <!-- 验证状态 -->
        <div class="verify-status" v-if="verifyStatus">
          <div v-if="verifyStatus === 'verifying'" class="status-verifying">
            <a-spin :spinning="true" />
            <span>正在验证中...</span>
          </div>
          
          <div v-else-if="verifyStatus === 'success'" class="status-success">
            <icon-check-circle />
            <span>验证成功！正在跳转...</span>
          </div>
          
          <div v-else-if="verifyStatus === 'error'" class="status-error">
            <icon-close-circle />
            <span>{{ errorMessage }}</span>
            <a-button type="primary" @click="resetVerification" size="small">
              重新验证
            </a-button>
          </div>
        </div>

        <!-- 加载失败提示 -->
        <div v-if="loadError" class="load-error">
          <icon-exclamation-circle />
          <p>验证组件加载失败，请检查网络连接或刷新页面重试</p>
          <a-button type="primary" @click="reloadPage">刷新页面</a-button>
        </div>

        <!-- 跳过验证（开发模式） -->
        <div v-if="isDev" class="dev-skip">
          <a-button type="text" @click="skipVerification" size="small">
            开发模式：跳过验证
          </a-button>
        </div>
      </div>

      <div class="verify-footer">
        <p>
          <icon-info-circle />
          此验证由 Cloudflare 提供，用于防止恶意访问
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconCheckCircle, IconCloseCircle, IconExclamationCircle, IconInfoCircle } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const turnstileRef = ref(null)
const siteKey = ref('')
const verifyStatus = ref('')
const errorMessage = ref('')
const loadError = ref(false)
const isDev = import.meta.env.DEV

// Turnstile相关变量
let turnstileWidgetId = null
let turnstileLoaded = false

// 获取验证配置
const fetchConfig = async () => {
  try {
    const apiUrl = isDev 
      ? '/api/cf-verify/config'
      : 'http://117.72.61.26:3001/config'
    
    const response = await fetch(apiUrl)
    const config = await response.json()
    siteKey.value = config.siteKey
    
    if (!siteKey.value) {
      throw new Error('Site key not configured')
    }
  } catch (error) {
    console.error('Failed to fetch config:', error)
    loadError.value = true
  }
}

// 加载Cloudflare Turnstile脚本
const loadTurnstileScript = () => {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      turnstileLoaded = true
      resolve()
    }
    script.onerror = () => {
      loadError.value = true
      reject(new Error('Failed to load Turnstile script'))
    }
    
    document.head.appendChild(script)
  })
}

// 渲染Turnstile widget
const renderTurnstile = () => {
  if (!window.turnstile || !turnstileRef.value || !siteKey.value) {
    return
  }

  try {
    turnstileWidgetId = window.turnstile.render(turnstileRef.value, {
      sitekey: siteKey.value,
      theme: 'auto',
      callback: 'onTurnstileCallback',
      'error-callback': 'onTurnstileError',
      'expired-callback': 'onTurnstileExpired',
      'timeout-callback': 'onTurnstileTimeout'
    })
  } catch (error) {
    console.error('Failed to render Turnstile:', error)
    loadError.value = true
  }
}

// Turnstile回调函数
window.onTurnstileCallback = async (token) => {
  verifyStatus.value = 'verifying'
  
  try {
    const apiUrl = isDev 
      ? '/api/cf-verify/verify'
      : 'http://117.72.61.26:3001/verify'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        userIP: '' // 服务器会自动获取IP
      })
    })

    const result = await response.json()
    
    if (result.success) {
      verifyStatus.value = 'success'
      
      // 存储验证令牌
      localStorage.setItem('cf_verify_token', result.verifyToken)
      localStorage.setItem('cf_verify_expires', Date.now() + result.expiresIn * 1000)
      
      // 跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 1500)
    } else {
      throw new Error(result.error || 'Verification failed')
    }
  } catch (error) {
    console.error('Verification error:', error)
    verifyStatus.value = 'error'
    errorMessage.value = error.message || '验证失败，请重试'
  }
}

window.onTurnstileError = (error) => {
  console.error('Turnstile error:', error)
  verifyStatus.value = 'error'
  errorMessage.value = '验证组件出现错误'
}

window.onTurnstileExpired = () => {
  console.warn('Turnstile expired')
  verifyStatus.value = 'error'
  errorMessage.value = '验证已过期，请重新验证'
}

window.onTurnstileTimeout = () => {
  console.warn('Turnstile timeout')
  verifyStatus.value = 'error'
  errorMessage.value = '验证超时，请重试'
}

// 重置验证
const resetVerification = () => {
  verifyStatus.value = ''
  errorMessage.value = ''
  
  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId)
  }
}

// 跳过验证（仅开发模式）
const skipVerification = () => {
  if (isDev) {
    localStorage.setItem('cf_verify_token', 'dev_token')
    localStorage.setItem('cf_verify_expires', Date.now() + 3600000) // 1小时
    router.push('/home')
  }
}

// 刷新页面
const reloadPage = () => {
  window.location.reload()
}

// 初始化
onMounted(async () => {
  // 检查是否已经验证过
  const verifyToken = localStorage.getItem('cf_verify_token')
  const verifyExpires = localStorage.getItem('cf_verify_expires')
  
  if (verifyToken && verifyExpires && Date.now() < parseInt(verifyExpires)) {
    // 验证仍有效，直接跳转
    router.push('/home')
    return
  }

  // 清除过期的验证
  localStorage.removeItem('cf_verify_token')
  localStorage.removeItem('cf_verify_expires')

  try {
    await fetchConfig()
    await loadTurnstileScript()
    
    // 等待DOM更新后渲染
    setTimeout(renderTurnstile, 100)
  } catch (error) {
    console.error('Initialization error:', error)
    loadError.value = true
  }
})

// 清理
onUnmounted(() => {
  // 清理全局回调函数
  delete window.onTurnstileCallback
  delete window.onTurnstileError
  delete window.onTurnstileExpired
  delete window.onTurnstileTimeout
})
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.verify-container {
  background: var(--color-bg-1);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.verify-header h1 {
  margin: 0 0 16px 0;
  color: var(--color-text-1);
  font-size: 28px;
  font-weight: 600;
}

.verify-header p {
  margin: 0 0 32px 0;
  color: var(--color-text-2);
  font-size: 16px;
  line-height: 1.6;
}

.turnstile-widget {
  margin: 32px 0;
  min-height: 65px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.verify-status {
  margin: 24px 0;
  padding: 16px;
  border-radius: 8px;
}

.status-verifying {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-primary-6);
}

.status-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-success-6);
  background: var(--color-success-light-1);
  border: 1px solid var(--color-success-light-3);
}

.status-error {
  color: var(--color-danger-6);
  background: var(--color-danger-light-1);
  border: 1px solid var(--color-danger-light-3);
}

.status-error span {
  display: block;
  margin-bottom: 12px;
}

.load-error {
  padding: 24px;
  color: var(--color-warning-6);
  background: var(--color-warning-light-1);
  border: 1px solid var(--color-warning-light-3);
  border-radius: 8px;
  margin: 24px 0;
}

.load-error p {
  margin: 8px 0 16px 0;
}

.dev-skip {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-2);
}

.verify-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-2);
}

.verify-footer p {
  margin: 0;
  color: var(--color-text-3);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .verify-container {
    padding: 24px;
    margin: 16px;
  }
  
  .verify-header h1 {
    font-size: 24px;
  }
}

/* 暗色主题适配 */
.dark-theme .verify-page {
  background: linear-gradient(135deg, #2c2c54 0%, #40407a 100%);
}
</style>