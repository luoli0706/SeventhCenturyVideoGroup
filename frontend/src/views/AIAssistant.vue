<template>
  <div :class="['ai-assistant-page', { 'dark-theme': isDark }]">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <a-button type="text" @click="goBack" class="back-button">
        <icon-arrow-left />
        返回首页
      </a-button>
      <h1 class="assistant-title">视小姬 AI助手</h1>
      <a-button type="outline" @click="startNewSession" size="small">
        新对话
      </a-button>
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
              <p>我是柒世纪视频组的AI助手视小姬，很高兴为您服务喵！有什么问题可以随时问我喵～</p>
              <div class="session-info">
                <small>会话ID: {{ sessionId }}</small>
              </div>
            </div>
          </div>

          <!-- 聊天消息 -->
          <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
            <div v-if="message.role === 'assistant'" class="avatar assistant-avatar">视</div>
            <div class="message-content">
              <div 
                v-if="message.role === 'assistant'" 
                class="message-text markdown-content"
                v-html="renderMarkdown(message.content)"
              ></div>
              <div 
                v-else 
                class="message-text user-message"
              >{{ message.content }}</div>
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
const sessionId = ref('')

// Markdown渲染函数
const renderMarkdown = (text) => {
  if (!text) return ''
  
  // 转义HTML特殊字符
  const escapeHtml = (str) => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
  
  let html = escapeHtml(text)
  
  // 代码块 (```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || ''}">${code.trim()}</code></pre>`
  })
  
  // 行内代码 (`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
  // 粗体 (**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 斜体 (*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // 标题 (#)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  
  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // 无序列表 (-)
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // 有序列表 (1.)
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
  
  // 换行处理
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')
  
  // 包装段落
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>'
  }
  
  return html
}

// 生成会话ID
const generateSessionId = () => {
  const userInfo = auth.getUserInfo()
  const userId = userInfo?.cn || 'guest'
  const timestamp = Date.now()
  return `${userId}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
}

// 初始化会话ID
const initializeSession = () => {
  sessionId.value = generateSessionId()
  console.log('会话ID已生成:', sessionId.value)
}

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

// 开始新会话
const startNewSession = () => {
  messages.value = []
  initializeSession()
  console.log('新会话已开始，ID:', sessionId.value)
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
    // 第一步：通过RAG API处理用户查询
    console.log('开始RAG处理...')
    const ragResponse = await fetch('/api/rag/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        top_k: 3,
        category: '' // 可以根据需要设置类别过滤
      })
    })

    let enhancedQuery = message // 默认使用原始查询
    
    if (ragResponse.ok) {
      const ragData = await ragResponse.json()
      console.log('RAG处理结果:', ragData)
      
      // 使用RAG增强后的查询
      if (ragData.enhanced_query && ragData.enhanced_query.trim()) {
        enhancedQuery = ragData.enhanced_query
        console.log('使用RAG增强查询:', enhancedQuery)
      }
    } else {
      console.warn('RAG处理失败，使用原始查询:', ragResponse.status)
    }

    // 第二步：发送处理后的查询到n8n容器
    console.log('发送到n8n...')
    const apiUrl = import.meta.env.DEV 
      ? '/api/n8n/webhook/ai-chat'  // 开发环境：使用webhook-test
      : 'http://localhost:5678/webhook/ai-chat'  // 生产环境：使用webhook
      
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        cn: userInfo?.cn || 'unknown',
        message: enhancedQuery, // 使用RAG增强后的查询
        originalMessage: message, // 保留原始用户消息用于记录
        model: selectedModel.value,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 创建AI消息占位符
    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    messages.value.push(aiMessage)
    
    // 处理流式响应
    console.log('开始处理流式响应...')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let receivedAnyContent = false

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        console.log('流式响应读取完成')
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一行（可能不完整）

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            console.log('解析到数据:', data)
            
            if (data.type === 'item' && data.content) {
              receivedAnyContent = true
              // 实时更新消息内容
              const messageIndex = messages.value.findIndex(msg => msg.id === aiMessage.id)
              if (messageIndex !== -1) {
                messages.value[messageIndex].content += data.content
                // 滚动到底部
                await nextTick()
                scrollToBottom()
              }
            } else if (data.type === 'begin') {
              console.log('开始接收AI响应')
            } else if (data.type === 'end') {
              console.log('AI响应结束')
            }
          } catch (parseError) {
            console.warn('解析流数据失败:', parseError, '原始数据:', line)
          }
        }
      }
    }

    // 处理缓冲区剩余数据
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer)
        if (data.type === 'item' && data.content) {
          const messageIndex = messages.value.findIndex(msg => msg.id === aiMessage.id)
          if (messageIndex !== -1) {
            messages.value[messageIndex].content += data.content
          }
        }
      } catch (parseError) {
        console.warn('解析最后数据失败:', parseError)
      }
    }

    // 如果没有收到任何内容，显示默认消息
    const finalMessageIndex = messages.value.findIndex(msg => msg.id === aiMessage.id)
    if (finalMessageIndex !== -1 && !messages.value[finalMessageIndex].content.trim()) {
      messages.value[finalMessageIndex].content = receivedAnyContent 
        ? '响应已完成，但内容为空。' 
        : '抱歉，我暂时无法回应，请稍后再试。'
    }
    
    console.log('最终消息内容:', messages.value[finalMessageIndex]?.content)

  } catch (error) {
    console.error('发送消息失败:', error)
    
    let errorContent = '抱歉，连接AI服务时出现了问题。'
    
    // 根据错误类型提供更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorContent = '无法连接到AI服务，请检查n8n服务是否正在运行。'
    } else if (error.message.includes('CORS')) {
      errorContent = 'CORS跨域错误，请检查n8n webhook配置。'
    } else if (error.message.includes('500')) {
      errorContent = 'AI服务内部错误，请稍后再试或联系管理员。'
    } else if (error.message.includes('404')) {
      errorContent = 'AI服务端点未找到，请检查webhook配置。'
    } else if (error.message.includes('JSON')) {
      errorContent = '数据格式解析错误，AI服务可能正在处理中，请稍后再试。'
    }
    
    // 检查是否已经有AI消息，如果有就更新它，否则创建新的错误消息
    const existingAiMessageIndex = messages.value.findIndex(
      msg => msg.role === 'assistant' && msg.content === ''
    )
    
    if (existingAiMessageIndex !== -1) {
      // 更新现有的空消息
      messages.value[existingAiMessageIndex].content = errorContent
    } else {
      // 添加新的错误消息
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      messages.value.push(errorMessage)
    }
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
  // 初始化会话ID
  initializeSession()
  
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
  text-align: left;
}

.welcome-message .message-content {
  text-align: left;
}

.welcome-message h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--color-text-1);
  text-align: left;
}

.welcome-message p {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.6;
  text-align: left;
}

.session-info {
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--color-bg-3);
  border-radius: 4px;
  font-family: monospace;
}

.session-info small {
  color: var(--color-text-3);
  font-size: 12px;
}

/* 消息 */
.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 800px;
  width: 100%;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
  max-width: 600px;
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
  word-wrap: break-word;
  text-align: left;
}

.user-message {
  white-space: pre-wrap;
}

.message.user .message-text {
  background: var(--color-primary-6);
  color: white;
  white-space: pre-wrap;
}

/* Markdown样式 */
.markdown-content {
  text-align: left;
}

.markdown-content p {
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.markdown-content p:last-child {
  margin-bottom: 0;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-content h1 {
  font-size: 1.4em;
  color: var(--color-text-1);
}

.markdown-content h2 {
  font-size: 1.2em;
  color: var(--color-text-1);
}

.markdown-content h3 {
  font-size: 1.1em;
  color: var(--color-text-1);
}

.markdown-content strong {
  font-weight: 600;
  color: var(--color-text-1);
}

.markdown-content em {
  font-style: italic;
  color: var(--color-text-2);
}

.markdown-content code.inline-code {
  background: var(--color-fill-2);
  color: var(--color-text-1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre.code-block {
  background: var(--color-bg-3);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.markdown-content pre.code-block code {
  background: none;
  color: var(--color-text-1);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.4;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 4px 0;
  line-height: 1.6;
}

.markdown-content a {
  color: var(--color-primary-6);
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
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

/* 暗色主题下的Markdown样式 */
.dark-theme .markdown-content pre.code-block {
  background: #1e1e1e;
  border-color: #3e3e42;
}

.dark-theme .markdown-content code.inline-code {
  background: #2e2e30;
  color: #e5e5e5;
}

.dark-theme .markdown-content h1,
.dark-theme .markdown-content h2,
.dark-theme .markdown-content h3 {
  color: #ffffff;
}

.dark-theme .markdown-content strong {
  color: #ffffff;
}
</style>