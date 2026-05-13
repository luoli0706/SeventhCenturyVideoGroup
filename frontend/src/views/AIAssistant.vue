<template>
  <div :class="['ai-page', isDark ? 'theme-dark' : 'theme-light']">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <div class="nav-left">
        <button class="nav-back" @click="goBack">
          <span class="nav-arrow">←</span>
        </button>
        <button class="nav-history-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory" title="历史记录">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <h1 class="nav-title">视小姬 AI助手</h1>
      <button class="nav-new" @click="startNewSession">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        新对话
      </button>
    </nav>

    <!-- History sidebar -->
    <div :class="['history-sidebar', showHistory ? 'open' : '']">
      <div class="sidebar-header">
        <span class="sidebar-title">历史对话</span>
        <button class="sidebar-close" @click="showHistory = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="sidebar-list">
        <div v-if="sessions.length === 0" class="sidebar-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.2"/>
            <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <p>暂无历史对话</p>
        </div>
        <div
          v-for="s in sessions"
          :key="s.id"
          :class="['session-item', s.id === sessionId ? 'active' : '']"
          @click="loadSession(s.id)"
        >
          <div class="si-main">
            <span class="si-title">{{ s.title || '新对话' }}</span>
            <span class="si-meta">{{ s.message_count }} 条消息 · {{ formatDate(s.updated_at) }}</span>
          </div>
          <button class="si-delete" @click.stop="deleteSession(s.id)" title="删除">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div v-if="showHistory" class="sidebar-overlay" @click="showHistory = false"></div>

    <main :class="['page-content', showHistory ? 'with-sidebar' : '']">
      <!-- Messages -->
      <div class="messages-area" ref="messagesArea">
        <!-- Welcome -->
        <div v-if="messages.length === 0" class="welcome">
          <div class="welcome-avatar">
            <div class="wa-ring"></div>
            <div class="wa-circle">视</div>
          </div>
          <h2 class="welcome-title">你好！我是视小姬</h2>
          <p class="welcome-desc">柒世纪视频组的 AI 助手，<br>有什么问题都可以问我喵～</p>
        </div>

        <!-- Chat messages -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="msg"
          :class="[msg.role, msg.role === 'assistant' && msg.content === '' ? 'msg-streaming' : '']"
        >
          <!-- Assistant message -->
          <template v-if="msg.role === 'assistant'">
            <div class="msg-avatar avi-assistant">
              <span>视</span>
            </div>
            <div class="msg-bubble">
              <div class="msg-text" v-html="renderMarkdown(msg.content)"></div>
              <div class="msg-time" v-if="msg.content && !msg.content.includes('抱歉')">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </template>

          <!-- User message -->
          <template v-else-if="msg.role === 'user'">
            <div class="msg-bubble msg-bubble-user">
              <div class="msg-text">{{ msg.content }}</div>
              <div class="msg-time msg-time-user">{{ formatTime(msg.timestamp) }}</div>
            </div>
            <div class="msg-avatar avi-user">{{ getUserInitial() }}</div>
          </template>

          <!-- System message (references etc.) -->
          <div v-else-if="msg.role === 'system'" class="msg-system">
            <div class="sys-content">
              <span class="sys-dot"></span>
              {{ msg.content }}
              <details v-if="msg.references?.length" class="sys-refs">
                <summary>查看参考资料</summary>
                <div v-for="(ref, i) in msg.references.slice(0,3)" :key="i" class="ref-item">
                  <strong>{{ ref.title }}</strong>
                  <p>{{ (ref.content || '').substring(0, 120) }}...</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isLoading" class="msg msg-assistant">
          <div class="msg-avatar avi-assistant"><span>视</span></div>
          <div class="msg-bubble">
            <div class="typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Input area -->
    <div class="input-area">
      <div class="input-inner">
        <div class="input-toolbar">
          <select v-model="selectedModel" class="model-select">
            <option value="deepseek-v4-flash">DeepSeek-V4-Flash</option>
            <option value="deepseek-v4-pro">DeepSeek-V4-Pro</option>
          </select>
        </div>
        <div class="input-row">
          <textarea
            v-model="inputMessage"
            :placeholder="isUserMember ? '有什么想问视小姬的吗？' : '请先登录为社团成员后使用AI助手'"
            :disabled="!isUserMember"
            rows="1"
            class="input-textarea"
            @keydown.enter.exact="handleSend"
            @keydown.enter.shift.exact="handleNewLine"
            @input="autoResize"
          ></textarea>
          <button class="send-btn" :disabled="!canSend" @click="handleSend">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9l14-7-7 14-2-5-5-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div v-if="!isUserMember" class="input-notice">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
            <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span>AI 助手功能仅对社团成员开放，请先登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils/auth'

const router = useRouter()
const isDark = ref(true)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('deepseek-v4-flash')
const messagesArea = ref(null)
const sessionId = ref('')
const showHistory = ref(false)
const sessions = ref([])

function goBack() { router.push('/home') }

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function fetchSessions() {
  try {
    const resp = await fetch('/api/ai/sessions')
    if (!resp.ok) return
    const data = await resp.json()
    sessions.value = data.sessions || []
  } catch (e) {
    // silently fail
  }
}

async function loadSession(sid) {
  try {
    showHistory.value = false
    sessionId.value = sid
    const resp = await fetch(`/api/ai/sessions/${encodeURIComponent(sid)}`)
    if (!resp.ok) return
    const data = await resp.json()
    const loaded = (data.messages || []).map((m, i) => ({
      id: i + 1,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at?.replace(' ', 'T') || Date.now()),
    }))
    messages.value = loaded
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error('Failed to load session:', e)
  }
}

async function deleteSession(sid) {
  try {
    await fetch(`/api/ai/sessions/${encodeURIComponent(sid)}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter(s => s.id !== sid)
    if (sessionId.value === sid) {
      startNewSession()
    }
  } catch (e) {
    console.error('Failed to delete session:', e)
  }
}

const isUserMember = computed(() => auth.isMember() && auth.getUserType() === 'member')
const canSend = computed(() => isUserMember.value && inputMessage.value.trim() !== '' && !isLoading.value)

function getUserInitial() {
  const info = auth.getUserInfo()
  return info?.cn ? info.cn.charAt(0) : 'U'
}

function formatTime(ts) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(ts)
}

function scrollToBottom() {
  nextTick().then(() => {
    if (messagesArea.value) messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  })
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function handleNewLine() {
  inputMessage.value += '\n'
}

function generateSessionId() {
  const info = auth.getUserInfo()
  const uid = info?.cn || 'guest'
  return `${uid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function startNewSession() {
  messages.value = []
  sessionId.value = generateSessionId()
  fetchSessions()
}

const renderMarkdown = (text) => {
  if (!text) return ''
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }
  let html = esc(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => `<pre class="code-block"><code>${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  if (!html.startsWith('<')) html = '<p>' + html + '</p>'
  return html
}

const handleSend = async (event) => {
  if (event && !event.shiftKey) event.preventDefault()
  if (!canSend.value) return

  const text = inputMessage.value.trim()
  const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: new Date() }
  messages.value.push(userMsg)
  inputMessage.value = ''
  scrollToBottom()

  isLoading.value = true

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: sessionId.value, model: selectedModel.value })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    const aiMsg = { id: Date.now() + 1, role: 'assistant', content: '', timestamp: new Date() }
    messages.value.push(aiMsg)
    scrollToBottom()

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let gotContent = false

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.type === 'item' && data.content) {
            gotContent = true
            const idx = messages.value.findIndex(m => m.id === aiMsg.id)
            if (idx !== -1) {
              messages.value[idx].content += data.content
              scrollToBottom()
            }
          } else if (data.type === 'references' && data.chunks) {
            messages.value.push({
              id: Date.now() + 0.5, role: 'system',
              content: `已检索 ${data.chunks.length} 条相关资料`,
              references: data.chunks.slice(0, 3), timestamp: new Date()
            })
            scrollToBottom()
          } else if (data.type === 'thinking') {
            // optional: thinking indicator
          }
        } catch (e) { /* skip parse errors */ }
      }
    }

    // Final empty check
    const fi = messages.value.findIndex(m => m.id === aiMsg.id)
    if (fi !== -1 && !messages.value[fi].content.trim()) {
      messages.value[fi].content = gotContent ? '响应完成，内容为空。' : '抱歉，我暂时无法回应，请稍后再试。'
    }
  } catch (err) {
    console.error('Chat error:', err)
    const errMsg = err.message?.includes('fetch') ? '无法连接到AI服务，请检查后端是否正在运行。'
      : err.message?.includes('500') ? 'AI服务内部错误，请稍后再试。'
      : '抱歉，连接AI服务时出现了问题。'
    const ei = messages.value.findIndex(m => m.role === 'assistant' && m.content === '')
    if (ei !== -1) messages.value[ei].content = errMsg
    else messages.value.push({ id: Date.now() + 1, role: 'assistant', content: errMsg, timestamp: new Date() })
  } finally {
    isLoading.value = false
    scrollToBottom()
    fetchSessions()
  }
}

function updateTheme() {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  sessionId.value = generateSessionId()
  updateTheme()
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
  fetchSessions()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

.ai-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
}
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(15,155,142,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(230,168,23,0.03) 0%, transparent 50%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

/* --- Nav --- */
.page-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px;
  background: rgba(8,8,26,0.88); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.nav-back {
  background: none; border: none;
  color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer;
  padding: 6px 12px; border-radius: 8px;
  transition: all 0.25s ease; font-family: inherit;
  display: flex; align-items: center; gap: 4px;
}
.nav-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.08); }
.nav-arrow { display: inline-block; transition: transform 0.25s ease; }
.nav-back:hover .nav-arrow { transform: translateX(-3px); }
.nav-title {
  font-size: 1rem; font-weight: 600;
  color: rgba(255,255,255,0.7); letter-spacing: 1px; margin: 0;
  background: linear-gradient(135deg, #0f9b8e, #e6a817);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.nav-left {
  display: flex; align-items: center; gap: 4px;
}
.nav-history-btn {
  background: none; border: none;
  color: rgba(255,255,255,0.3); cursor: pointer;
  padding: 6px; border-radius: 8px;
  transition: all 0.25s ease;
  display: flex; align-items: center;
}
.nav-history-btn:hover { color: #0f9b8e; background: rgba(15,155,142,0.08); }
.nav-history-btn.active { color: #0f9b8e; }
.nav-new {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(15,155,142,0.12);
  color: #0f9b8e; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 8px;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.nav-new:hover {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.25);
}

/* --- History sidebar --- */
.history-sidebar {
  position: fixed;
  top: 56px; left: 0; bottom: 0;
  width: 280px;
  z-index: 90;
  background: rgba(10,10,28,0.95);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255,255,255,0.04);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column;
}
.history-sidebar.open {
  transform: translateX(0);
}
.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.sidebar-title {
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.sidebar-close {
  background: none; border: none;
  color: rgba(255,255,255,0.15); cursor: pointer;
  padding: 4px; border-radius: 6px;
  transition: all 0.2s;
  display: flex;
}
.sidebar-close:hover { color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); }
.sidebar-list {
  flex: 1; overflow-y: auto;
  padding: 8px 0;
}
.sidebar-list::-webkit-scrollbar { width: 3px; }
.sidebar-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 2px; }
.sidebar-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px; color: rgba(255,255,255,0.08);
  text-align: center;
}
.sidebar-empty p { margin: 10px 0 0; font-size: 13px; color: rgba(255,255,255,0.1); }
.session-item {
  display: flex; align-items: center;
  padding: 10px 14px;
  margin: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}
.session-item:hover {
  background: rgba(255,255,255,0.02);
}
.session-item.active {
  background: rgba(15,155,142,0.04);
  border: 1px solid rgba(15,155,142,0.06);
}
.si-main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.si-title {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.5);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.session-item.active .si-title { color: #0f9b8e; }
.si-meta {
  font-size: 10px;
  color: rgba(255,255,255,0.12);
}
.si-delete {
  background: none; border: none;
  color: rgba(255,255,255,0.06); cursor: pointer;
  padding: 4px; border-radius: 6px;
  transition: all 0.2s; flex-shrink: 0;
  display: flex; opacity: 0;
}
.session-item:hover .si-delete { opacity: 1; }
.si-delete:hover { color: rgba(230,168,23,0.5); background: rgba(230,168,23,0.04); }
.sidebar-overlay {
  position: fixed; inset: 0; z-index: 85;
  background: rgba(0,0,0,0.3);
  display: none;
}

/* --- Messages area --- */
.page-content {
  position: relative; z-index: 1;
  flex: 1; overflow-y: auto;
  padding: 80px 0 0;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-content.with-sidebar {
  margin-left: 280px;
}

.messages-area {
  max-width: 720px; margin: 0 auto;
  padding: 32px 24px 140px;
}

/* --- Welcome --- */
.welcome {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 20px 40px;
  animation: fadeUp 0.8s ease;
}
.welcome-avatar { position: relative; margin-bottom: 24px; }
.wa-ring {
  position: absolute; inset: -8px;
  border-radius: 50%;
  border: 1.5px solid rgba(15,155,142,0.1);
  animation: ringPulse 3s ease-in-out infinite;
}
@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.06); opacity: 1; }
}
.wa-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(15,155,142,0.12), rgba(230,168,23,0.08));
  border: 1px solid rgba(15,155,142,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; font-weight: 700;
  color: rgba(15,155,142,0.5);
}
.welcome-title {
  font-size: 1.4rem; font-weight: 700; letter-spacing: 1px;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.5));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.welcome-desc {
  font-size: 0.95rem; color: rgba(255,255,255,0.25);
  text-align: center; line-height: 1.7; margin: 0;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Message layout --- */
.msg {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 20px; animation: fadeUp 0.4s ease;
}

.msg-avatar {
  width: 36px; height: 36px;
  border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 600;
}
.avi-assistant {
  background: linear-gradient(135deg, rgba(15,155,142,0.15), rgba(230,168,23,0.08));
  border: 1px solid rgba(15,155,142,0.1);
  color: rgba(15,155,142,0.6);
}
.avi-user {
  background: rgba(230,168,23,0.08);
  border: 1px solid rgba(230,168,23,0.08);
  color: rgba(230,168,23,0.5);
}

.msg-bubble {
  flex: 1; min-width: 0;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px;
  padding: 14px 18px;
  transition: border-color 0.2s;
}
.msg-bubble:hover {
  border-color: rgba(15,155,142,0.08);
}
.msg-text {
  font-size: 0.92rem; line-height: 1.7;
  color: rgba(255,255,255,0.7);
  word-wrap: break-word;
}
.msg-text p { margin: 0 0 8px; }
.msg-text p:last-child { margin-bottom: 0; }
.msg-time {
  font-size: 11px; color: rgba(255,255,255,0.12);
  margin-top: 6px; font-family: 'JetBrains Mono', monospace;
}

/* User message */
.msg.user {
  flex-direction: row-reverse;
}
.msg-bubble-user {
  background: rgba(15,155,142,0.06);
  border-color: rgba(15,155,142,0.08);
}
.msg-bubble-user .msg-text { color: rgba(255,255,255,0.85); }
.msg-time-user { text-align: right; }

/* Streaming state */
.msg-streaming .msg-bubble {
  border-color: rgba(15,155,142,0.15);
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { border-color: rgba(15,155,142,0.08); }
  50% { border-color: rgba(15,155,142,0.2); }
}

/* System message */
.msg-system {
  justify-content: center;
  margin: 12px 0;
}
.sys-content {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.03);
  padding: 8px 16px; border-radius: 20px;
  max-width: 90%;
}
.sys-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(15,155,142,0.3); flex-shrink: 0;
}
.sys-refs { margin-top: 4px; }
.sys-refs summary {
  cursor: pointer; color: rgba(15,155,142,0.6);
  font-size: 11px; user-select: none;
}
.ref-item {
  background: rgba(255,255,255,0.02);
  border-left: 2px solid rgba(15,155,142,0.15);
  padding: 6px 10px; margin-top: 4px; border-radius: 4px;
}
.ref-item strong { display: block; font-size: 11px; color: rgba(255,255,255,0.5); }
.ref-item p { margin: 2px 0 0; font-size: 10px; color: rgba(255,255,255,0.2); }

/* --- Markdown --- */
.msg-text :deep(h1), .msg-text :deep(h2), .msg-text :deep(h3) {
  margin: 16px 0 8px; font-weight: 600; color: #fff;
}
.msg-text :deep(h1) { font-size: 1.15em; }
.msg-text :deep(h2) { font-size: 1.08em; }
.msg-text :deep(h3) { font-size: 1.02em; }
.msg-text :deep(strong) { color: #fff; font-weight: 600; }
.msg-text :deep(em) { font-style: italic; color: rgba(255,255,255,0.5); }
.msg-text :deep(a) { color: #0f9b8e; text-decoration: none; }
.msg-text :deep(a:hover) { text-decoration: underline; }
.msg-text :deep(code.inline-code) {
  background: rgba(255,255,255,0.04);
  padding: 1px 5px; border-radius: 4px;
  font-family: 'JetBrains Mono', monospace; font-size: 0.85em;
}
.msg-text :deep(pre.code-block) {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px; padding: 12px;
  margin: 8px 0; overflow-x: auto;
}
.msg-text :deep(pre.code-block code) {
  background: none; color: rgba(255,255,255,0.6);
  font-family: 'JetBrains Mono', monospace; font-size: 0.85em;
}
.msg-text :deep(ul), .msg-text :deep(ol) {
  margin: 8px 0; padding-left: 20px;
}
.msg-text :deep(li) { margin: 3px 0; }

/* --- Typing --- */
.typing { display: flex; gap: 5px; padding: 4px 0; }
.typing span {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(15,155,142,0.4);
  animation: typingBounce 1.4s infinite ease-in-out;
}
.typing span:nth-child(1) { animation-delay: -0.32s; }
.typing span:nth-child(2) { animation-delay: -0.16s; }
@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* --- Input area --- */
.input-area {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: rgba(8,8,26,0.88);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.04);
}
.input-inner {
  max-width: 720px; margin: 0 auto;
  padding: 12px 24px 16px;
}
.input-toolbar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.model-select {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.model-select:hover { border-color: rgba(15,155,142,0.2); }
.model-select option { background: #1a1a2e; color: #e0e0ec; }

.input-row {
  display: flex; gap: 10px; align-items: flex-end;
}
.input-textarea {
  flex: 1;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.25s;
  line-height: 1.5;
  max-height: 120px;
}
.input-textarea::placeholder { color: rgba(255,255,255,0.15); }
.input-textarea:focus { border-color: rgba(15,155,142,0.2); }
.input-textarea:disabled { opacity: 0.4; cursor: not-allowed; }

.send-btn {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: none;
  background: #0f9b8e;
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.send-btn:hover { background: #0eb3a4; transform: scale(1.05); }
.send-btn:disabled { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.1); cursor: not-allowed; transform: none; }

.input-notice {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(230,168,23,0.4);
}

/* --- Scrollbar --- */
.page-content::-webkit-scrollbar { width: 4px; }
.page-content::-webkit-scrollbar-track { background: transparent; }
.page-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 2px; }

/* ========== Light mode ========== */
.ai-page.theme-light { background: #f5f7fb; color: #1d2129; }
.theme-light .bg-dots { background-image: radial-gradient(rgba(0,0,0,0.025) 0.5px, transparent 0.5px); }
.theme-light .page-nav { background: rgba(255,255,255,0.9); border-bottom-color: rgba(0,0,0,0.06); }
.theme-light .nav-back { color: rgba(0,0,0,0.35); }
.theme-light .nav-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.06); }
.theme-light .nav-title { color: #1d2129; -webkit-text-fill-color: unset; background: none; }
.theme-light .nav-history-btn { color: rgba(0,0,0,0.2); }
.theme-light .nav-history-btn:hover { color: #0f9b8e; background: rgba(15,155,142,0.06); }
.theme-light .nav-history-btn.active { color: #0f9b8e; }
.theme-light .history-sidebar {
  background: rgba(255,255,255,0.95);
  border-right-color: rgba(0,0,0,0.06);
}
.theme-light .sidebar-title { color: rgba(0,0,0,0.15); }
.theme-light .sidebar-close { color: rgba(0,0,0,0.1); }
.theme-light .sidebar-close:hover { color: rgba(0,0,0,0.3); background: rgba(0,0,0,0.02); }
.theme-light .sidebar-empty { color: rgba(0,0,0,0.04); }
.theme-light .sidebar-empty p { color: rgba(0,0,0,0.06); }
.theme-light .session-item:hover { background: rgba(0,0,0,0.02); }
.theme-light .session-item.active {
  background: rgba(15,155,142,0.04);
  border-color: rgba(15,155,142,0.08);
}
.theme-light .si-title { color: rgba(0,0,0,0.35); }
.theme-light .si-meta { color: rgba(0,0,0,0.08); }
.theme-light .si-delete { color: rgba(0,0,0,0.04); }
.theme-light .si-delete:hover { color: rgba(230,168,23,0.4); background: rgba(230,168,23,0.04); }
.theme-light .sidebar-overlay { background: rgba(0,0,0,0.15); }
.theme-light .welcome-title { background: none; -webkit-text-fill-color: unset; color: #1d2129; }
.theme-light .welcome-desc { color: rgba(0,0,0,0.2); }
.theme-light .msg-bubble { background: #fff; border-color: rgba(0,0,0,0.06); }
.theme-light .msg-bubble-user { background: rgba(15,155,142,0.04); border-color: rgba(15,155,142,0.08); }
.theme-light .msg-text { color: rgba(0,0,0,0.6); }
.theme-light .msg-bubble-user .msg-text { color: rgba(0,0,0,0.75); }
.theme-light .msg-time { color: rgba(0,0,0,0.08); }
.theme-light .msg-text :deep(h1), .theme-light .msg-text :deep(h2), .theme-light .msg-text :deep(h3),
.theme-light .msg-text :deep(strong) { color: #1d2129; }
.theme-light .msg-text :deep(em) { color: rgba(0,0,0,0.35); }
.theme-light .msg-text :deep(code.inline-code) { background: rgba(0,0,0,0.03); }
.theme-light .msg-text :deep(pre.code-block) { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); }
.theme-light .msg-text :deep(pre.code-block code) { color: rgba(0,0,0,0.5); }
.theme-light .sys-content { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.04); color: rgba(0,0,0,0.2); }
.theme-light .ref-item strong { color: rgba(0,0,0,0.4); }
.theme-light .ref-item p { color: rgba(0,0,0,0.2); }
.theme-light .input-area { background: rgba(255,255,255,0.9); border-top-color: rgba(0,0,0,0.06); }
.theme-light .input-textarea { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); color: rgba(0,0,0,0.6); }
.theme-light .input-textarea::placeholder { color: rgba(0,0,0,0.12); }
.theme-light .input-textarea:focus { border-color: rgba(15,155,142,0.2); }
.theme-light .model-select { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.06); color: rgba(0,0,0,0.3); }
.theme-light .model-select option { background: #fff; color: #1d2129; }
.theme-light .send-btn:disabled { background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.08); }
.theme-light .input-notice { color: rgba(230,168,23,0.5); }
.theme-light .sys-refs summary { color: rgba(15,155,142,0.5); }
.theme-light .avi-user { background: rgba(230,168,23,0.06); border-color: rgba(230,168,23,0.08); color: rgba(230,168,23,0.4); }
.theme-light .avi-assistant { background: linear-gradient(135deg, rgba(15,155,142,0.08), rgba(230,168,23,0.04)); border-color: rgba(15,155,142,0.08); color: rgba(15,155,142,0.5); }
.theme-light .page-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.04); }

@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .nav-title { font-size: 0.9rem; }
  .messages-area { padding: 24px 16px 130px; }
  .input-inner { padding: 10px 16px 12px; }
  .welcome { padding: 60px 16px 30px; }
  .wa-circle { width: 60px; height: 60px; font-size: 1.5rem; }
  .welcome-title { font-size: 1.2rem; }
  .history-sidebar {
    width: 100%;
    top: 52px;
  }
  .page-content.with-sidebar {
    margin-left: 0;
  }
  .sidebar-overlay {
    display: block;
  }
  .nav-history-btn.active {
    color: #0f9b8e;
  }
}
</style>
