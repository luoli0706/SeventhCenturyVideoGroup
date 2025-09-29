<template>
  <div :class="['ai-assistant-page', { 'dark-theme': isDark }]">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <a-button type="text" @click="goBack" class="back-button">
        <icon-arrow-left />
        返回首页
      </a-button>
      <h1 class="assistant-title">视小姬 AI助手</h1>
      <div style="width: 100px;"></div> <!-- 占位符，保持标题居中 -->
    </div>

    <div class="main-container">
      <!-- 左侧历史对话 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>历史对话</h3>
        </div>
        <div class="history-list disabled-feature">
          <div class="history-item">
            <span class="history-title">开发中...</span>
            <span class="history-time">敬请期待</span>
          </div>
        </div>
      </div>

      <!-- 主对话区域 -->
      <div class="chat-container">
        <!-- 对话消息区域 -->
        <div class="messages-area" ref="messagesArea">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="avatar assistant-avatar">视</div>
            <div class="message-content">
              <h2>你好！</h2>
              <p>我是柒世纪视频组的AI助手我是视小姬，很高兴为您服务喵！有什么问题可以随时问我喵～</p>
            </div>
          </div>

          <!-- 聊天消息 -->
          <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
            <div v-if="message.role === 'assistant'" class="avatar assistant-avatar">视</div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
            <div v-if="message.role === 'user'" class="avatar user-avatar">{{ getUserInitial() }}</div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="message assistant loading-message">
            <div class="avatar assistant-avatar">视</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 模型选择和多模态按钮 -->
          <div class="toolbar">
            <a-select 
              v-model="selectedModel" 
              :style="{ width: '200px' }" 
              placeholder="选择模型"
              class="model-selector"
            >
              <a-option value="deepseek-v3">DeepSeek-V3</a-option>
              <a-option value="deepseek-r1">DeepSeek-R1</a-option>
              <a-option value="gemini-2.5-pro" disabled class="disabled-option">
                Gemini 2.5 Pro (开发中)
              </a-option>
            </a-select>
            
            <a-button 
              class="multimodal-button disabled-feature" 
              disabled
              :style="{ marginLeft: '8px' }"
            >
              <icon-plus />
            </a-button>
          </div>

          <!-- 输入框 -->
          <div class="input-container">
            <a-textarea
              v-model="inputMessage"
              :placeholder="isUserMember ? '有什么想问视小姬的吗？' : '请先登录为社团成员后使用AI助手'"
              :disabled="!isUserMember"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              class="message-input"
              @keydown.enter.exact="handleSend"
              @keydown.enter.shift.exact.prevent="handleNewLine"
            />
            <a-button 
              type="primary" 
              :disabled="!canSend"
              @click="handleSend"
              class="send-button"
            >
              <icon-send />
            </a-button>
          </div>

          <!-- 权限提示 -->
          <div v-if="!isUserMember" class="permission-notice">
            <icon-info-circle />
            <span>AI助手功能仅对社团成员开放，请先登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils/auth'
import { IconArrowLeft, IconSend, IconPlus, IconInfoCircle } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const isDark = ref(false)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('deepseek-v3')
const messagesArea = ref(null)

// 用户权限检查
const isUserMember = computed(() => {
  return auth.isMember() && auth.getUserType() === 'member'
})

const canSend = computed(() => {
  return isUserMember.value && inputMessage.value.trim() !== '' && !isLoading.value
})

// 获取用户名首字母
const getUserInitial = () => {
  const userInfo = auth.getUserInfo()
  return userInfo?.cn ? userInfo.cn.charAt(0).toUpperCase() : 'U'
}

// 返回首页
const goBack = () => {
  router.push('/home')
}

// 发送消息
const handleSend = async (event) => {
  if (event && !event.shiftKey) {
    event.preventDefault()
  }
  
  if (!canSend.value) return

  const message = inputMessage.value.trim()
  const userInfo = auth.getUserInfo()
  
  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: message,
    timestamp: new Date()
  }
  messages.value.push(userMessage)
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 显示加载状态
  isLoading.value = true

  try {
    // 发送请求到n8n容器
    const response = await fetch('http://localhost:5678/webhook/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cn: userInfo?.cn || 'unknown',
        message: message,
        model: selectedModel.value
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // 添加AI回复
    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: data.response || '抱歉，我暂时无法回应，请稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(aiMessage)

  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 添加错误消息
    const errorMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '抱歉，连接AI服务时出现了问题，请检查网络连接或稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 处理换行
const handleNewLine = () => {
  inputMessage.value += '\n'
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

// 更新主题
const updateTheme = () => {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  // 监听主题变化
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
</script>

<style scoped>
.ai-assistant-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-1);
  color: var(--color-text-1);
}

.dark-theme {
  background: #000;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

/* 主容器 */
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-2);
}

.history-list {
  flex: 1;
  padding: 16px;
}

.disabled-feature {
  opacity: 0.5;
  pointer-events: none;
}

.history-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--color-bg-3);
  cursor: pointer;
}

.history-title {
  display: block;
  font-size: 14px;
  color: var(--color-text-2);
}

.history-time {
  display: block;
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 消息区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 600px;
  margin-bottom: 24px;
}

.welcome-message h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--color-text-1);
}

.welcome-message p {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.6;
}

/* 消息 */
.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 600px;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
}

.assistant-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-avatar {
  background: var(--color-primary-light-1);
  color: var(--color-primary-6);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  background: var(--color-bg-2);
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-text {
  background: var(--color-primary-6);
  color: white;
}

.message-time {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
  padding: 0 16px;
}

/* 加载状态 */
.loading-message .message-text {
  background: var(--color-bg-2);
  padding: 12px 16px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-3);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 输入区域 */
.input-area {
  border-top: 1px solid var(--color-border-2);
  padding: 16px 24px;
  background: var(--color-bg-1);
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.model-selector :deep(.arco-select-view-single) {
  font-size: 14px;
}

.multimodal-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.disabled-option {
  color: var(--color-text-4) !important;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.message-input :deep(.arco-textarea) {
  border-radius: 12px;
  resize: none;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--color-warning-light-1);
  color: var(--color-warning-6);
  border-radius: 8px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .messages-area {
    padding: 16px;
  }
  
  .input-area {
    padding: 12px 16px;
  }
  
  .message {
    max-width: none;
  }
  
  .welcome-message {
    max-width: none;
  }
}

/* 暗色主题适配 */
.dark-theme .top-nav {
  background: #17171a;
  border-bottom-color: #2e2e30;
}

.dark-theme .sidebar {
  background: #17171a;
  border-right-color: #2e2e30;
}

.dark-theme .sidebar-header {
  border-bottom-color: #2e2e30;
}

.dark-theme .input-area {
  background: #0b0b0c;
  border-top-color: #2e2e30;
}
</style>