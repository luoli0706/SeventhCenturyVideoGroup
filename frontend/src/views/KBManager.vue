<template>
  <div :class="['kb-manager', { 'dark-theme': isDark }]">
    <!-- 背景装饰 -->
    <div class="kb-bg-glow"></div>
    <div class="kb-bg-grid"></div>

    <div class="kb-header">
      <a-button type="text" @click="goBack" class="back-btn">
        <icon-arrow-left /> 返回首页
      </a-button>
      <h2 class="kb-title">知识库管理</h2>
      <div class="header-actions">
        <a-button type="secondary" size="small" @click="refreshTree" :loading="treeLoading" class="tool-btn">
          <icon-refresh /> 刷新
        </a-button>
        <div class="action-divider"></div>
        <a-button type="outline" size="small" @click="showCreateDialog('file')" class="tool-btn create-btn">
          <icon-file /> 新建文件
        </a-button>
        <a-button type="outline" size="small" @click="showCreateDialog('dir')" class="tool-btn create-btn">
          <icon-folder-add /> 新建目录
        </a-button>
        <a-button v-if="selectedPath" status="danger" size="small" @click="confirmDelete" class="tool-btn delete-btn">
          <icon-delete /> 删除
        </a-button>
      </div>
    </div>

    <div class="kb-body">
      <div class="kb-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">文件浏览</span>
          <span class="file-count">{{ fileCount }} 项</span>
        </div>
        <div class="search-wrap">
          <icon-search class="search-icon" />
          <input
            v-model="searchQuery"
            placeholder="搜索文件..."
            class="search-input"
          />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">&times;</button>
        </div>
        <div class="file-tree">
          <template v-if="treeLoading">
            <div class="tree-skeleton">
              <div v-for="i in 6" :key="i" class="skeleton-row" :style="{ animationDelay: i * 0.08 + 's' }">
                <span class="skeleton-icon"></span>
                <span class="skeleton-text" :style="{ width: (40 + Math.random() * 40) + '%' }"></span>
              </div>
            </div>
          </template>
          <template v-else>
            <TreeNode
              v-for="node in filteredTree"
              :key="node.path"
              :node="node"
              :depth="0"
              :selected-path="selectedPath"
              @select="selectNode"
            />
            <div v-if="filteredTree.length === 0" class="tree-empty">
              <icon-folder-delete />
              <p>{{ searchQuery ? '无匹配文件' : '知识库为空' }}</p>
            </div>
          </template>
        </div>
      </div>

      <div class="kb-editor">
        <template v-if="!selectedPath">
          <div class="editor-placeholder">
            <div class="placeholder-icon-wrap">
              <icon-file class="placeholder-icon" />
              <icon-file class="placeholder-icon-bg" />
            </div>
            <p class="placeholder-title">选择一个文件开始编辑</p>
            <p class="placeholder-desc">从左侧文件树中选择一个 Markdown 文件</p>
          </div>
        </template>
        <template v-else-if="selectedIsDir">
          <div class="editor-placeholder">
            <div class="placeholder-icon-wrap">
              <icon-folder class="placeholder-icon" />
              <icon-folder class="placeholder-icon-bg" />
            </div>
            <p class="placeholder-title">{{ selectedPath }}</p>
            <p class="placeholder-desc">当前选择的是目录，请选择一个文件来编辑</p>
          </div>
        </template>
        <template v-else>
          <div class="editor-toolbar">
            <div class="editor-filename">
              <icon-file class="file-icon" />
              <span class="filename-text">{{ selectedPath }}</span>
            </div>
            <div class="editor-actions">
              <a-tag v-if="contentChanged" color="orange" class="unsaved-tag">未保存</a-tag>
              <a-tag v-else-if="isIndexFile" color="gold" class="index-tag">系统文件 · 只读</a-tag>
              <div class="editor-status">
                <span class="char-count">{{ editContent.length }} 字符</span>
              </div>
              <a-button
                type="primary"
                size="mini"
                @click="saveContent"
                :loading="saving"
                :disabled="!contentChanged || isIndexFile"
                class="save-btn"
              >
                <icon-check v-if="!contentChanged && !saving" />
                {{ saving ? '保存中...' : contentChanged ? '保存' : '已保存' }}
              </a-button>
            </div>
          </div>
          <div class="editor-tabs-wrap">
            <button
              :class="['editor-tab', { active: editorTab === 'edit' }]"
              @click="editorTab = 'edit'"
            >
              <icon-edit /> 编辑
            </button>
            <button
              :class="['editor-tab', { active: editorTab === 'preview' }]"
              @click="editorTab = 'preview'"
            >
              <icon-eye /> 预览
            </button>
            <div class="tab-indicator" :style="{ left: editorTab === 'edit' ? '0' : '50%' }"></div>
          </div>
          <div class="editor-content" :class="{ 'is-preview': editorTab === 'preview' }">
            <textarea
              v-if="editorTab === 'edit'"
              v-model="editContent"
              class="markdown-editor"
              :placeholder="isIndexFile ? '索引文件由系统自动维护，不可手动编辑' : '在此编辑 Markdown 内容...'"
              :disabled="isIndexFile"
              @input="contentChanged = true"
              spellcheck="false"
            ></textarea>
            <div
              v-else
              class="markdown-preview"
              v-html="renderMarkdown(editContent)"
            ></div>
          </div>
        </template>
      </div>
    </div>

    <a-modal
      :visible="createDialogVisible"
      :title="createType === 'file' ? '新建文件' : '新建目录'"
      @cancel="createDialogVisible = false"
      @before-ok="handleCreate"
      class="kb-modal"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="父目录">
          <a-input v-model="createForm.parentPath" placeholder="留空则创建在根目录" />
        </a-form-item>
        <a-form-item :label="createType === 'file' ? '文件名' : '目录名'">
          <a-input v-model="createForm.name" :placeholder="'输入' + (createType === 'file' ? '文件名 (xxx.md)' : '目录名')" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api.js'
import { auth } from '../utils/auth.js'

const router = useRouter()
const isDark = ref(true)
const treeData = ref([])
const treeLoading = ref(false)
const selectedPath = ref('')
const selectedIsDir = ref(false)
const editContent = ref('')
const savedContent = ref('')
const contentChanged = ref(false)
const saving = ref(false)
const editorTab = ref('edit')
const searchQuery = ref('')
const createDialogVisible = ref(false)
const createType = ref('file')
const createForm = ref({ parentPath: '', name: '' })

const fileCount = computed(() => countFiles(treeData.value))

const isIndexFile = computed(() => {
  const name = selectedPath.value.split('/').pop() || ''
  return name === '索引.md'
})

function countFiles(nodes) {
  let count = 0
  for (const n of nodes) {
    if (!n.isDir) count++
    if (n.children) count += countFiles(n.children)
  }
  return count
}

const filteredTree = computed(() => {
  if (!searchQuery.value) return treeData.value
  return filterTree(treeData.value, searchQuery.value.toLowerCase())
})

function filterTree(nodes, query) {
  const result = []
  for (const n of nodes) {
    if (n.name.toLowerCase().includes(query)) {
      result.push(n)
    } else if (n.children && n.children.length > 0) {
      const filtered = filterTree(n.children, query)
      if (filtered.length > 0) {
        result.push({ ...n, children: filtered })
      }
    }
  }
  return result
}

const TreeNode = {
  name: 'TreeNode',
  props: {
    node: Object,
    selectedPath: String,
    depth: { type: Number, default: 0 },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const expanded = ref(true)
    const isSelected = computed(() => props.node.path === props.selectedPath)

    return () => {
      const { node, depth } = props

      // Expand toggle arrow
      const arrow = h('span', {
        class: ['tree-arrow', { expanded: expanded.value, hidden: !node.isDir }],
        onClick: (e) => { e.stopPropagation(); expanded.value = !expanded.value },
      }, node.isDir ? '▶' : '')

      // Icon
      const icon = h('span', { class: ['tree-icon', node.isDir ? 'dir-icon' : 'file-icon'] },
        node.isDir
          ? (expanded.value ? '📂' : '📁')
          : '📄'
      )

      // Name
      const nameSpan = h('span', { class: 'tree-name' }, node.name)

      // Row
      const row = h('div', {
        class: ['tree-row', { selected: isSelected.value }],
        onClick: () => emit('select', node),
      }, [arrow, icon, nameSpan])

      // Indent guide + children
      const children = [row]
      if (node.isDir && expanded.value && node.children) {
        const childContainer = h('div', { class: 'tree-children' },
          node.children.map(child =>
            h(TreeNode, {
              node: child,
              depth: depth + 1,
              selectedPath: props.selectedPath,
              onSelect: (n) => emit('select', n),
            })
          )
        )
        children.push(childContainer)
      }

      return h('div', { class: 'tree-node', 'data-depth': depth }, children)
    }
  },
}

onMounted(() => {
  auth.setAuthHeader(api)
  loadTree()
})

async function loadTree() {
  treeLoading.value = true
  try {
    const res = await api.get('/api/kb/tree')
    treeData.value = res.data || []
  } catch (err) {
    console.error('加载知识库失败:', err)
  } finally {
    treeLoading.value = false
  }
}

function refreshTree() {
  selectedPath.value = ''
  editContent.value = ''
  savedContent.value = ''
  contentChanged.value = false
  loadTree()
}

async function selectNode(node) {
  selectedPath.value = node.path
  selectedIsDir.value = node.isDir

  if (!node.isDir) {
    try {
      const res = await api.get('/api/kb/read', { params: { path: node.path } })
      editContent.value = res.data.content || ''
      savedContent.value = res.data.content || ''
      contentChanged.value = false
      editorTab.value = 'edit'
    } catch (err) {
      console.error('读取文件失败:', err)
    }
  }
}

async function saveContent() {
  saving.value = true
  try {
    await api.post('/api/kb/save', {
      path: selectedPath.value,
      content: editContent.value,
    })
    savedContent.value = editContent.value
    contentChanged.value = false
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function showCreateDialog(type) {
  createType.value = type
  createForm.value = {
    parentPath: selectedPath.value && selectedIsDir.value ? selectedPath.value : '',
    name: '',
  }
  createDialogVisible.value = true
}

async function handleCreate(done) {
  try {
    await api.post('/api/kb/create', {
      parentPath: createForm.value.parentPath,
      name: createForm.value.name,
      type: createType.value,
    })
    createDialogVisible.value = false
    loadTree()
  } catch (err) {
    console.error('创建失败:', err)
    alert('创建失败: ' + (err.response?.data?.error || err.message))
  }
  done(false)
}

function confirmDelete() {
  if (confirm(`确定删除「${selectedPath.value}」？此操作不可撤销。`)) {
    api({
      method: 'DELETE',
      url: '/api/kb/delete',
      data: { path: selectedPath.value },
    }).then(() => {
      selectedPath.value = ''
      editContent.value = ''
      savedContent.value = ''
      contentChanged.value = false
      loadTree()
    }).catch(err => {
      alert('删除失败: ' + (err.response?.data?.error || err.message))
    })
  }
}

function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
  return '<p>' + html + '</p>'
}

function goBack() {
  router.push('/home')
}
</script>

<style>
/* ============================================
   KB Manager — 创意深色主题美化
   ============================================ */

/* --- 字体导入 --- */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.kb-manager {
  --bg-deep: #0f0f1a;
  --bg-card: rgba(22, 33, 62, 0.85);
  --bg-surface: rgba(26, 26, 46, 0.9);
  --cyan: #0f9b8e;
  --cyan-glow: rgba(15, 155, 142, 0.25);
  --amber: #e6a817;
  --amber-dim: rgba(230, 168, 23, 0.15);
  --text-primary: #e8e8ef;
  --text-secondary: rgba(232, 232, 239, 0.6);
  --text-muted: rgba(232, 232, 239, 0.35);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.kb-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-sans);
  position: relative;
  overflow: hidden;
}

/* --- 背景装饰 --- */
.kb-bg-glow {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(15, 155, 142, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.kb-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* ============================================
   HEADER
   ============================================ */
.kb-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 14px 24px;
  background: rgba(15, 15, 26, 0.95);
  border-bottom: 1px solid var(--border-subtle);
  gap: 16px;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
}

.back-btn {
  color: var(--cyan) !important;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}
.back-btn:hover {
  background: var(--cyan-glow) !important;
}

.kb-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--border-hover);
  margin: 0 4px;
}

.tool-btn {
  border-radius: var(--radius-sm) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  transition: var(--transition) !important;
  font-family: var(--font-sans);
}

.tool-btn:not(.delete-btn) {
  border-color: var(--border-hover) !important;
  color: var(--text-secondary) !important;
}

.tool-btn:not(.delete-btn):hover {
  border-color: var(--cyan) !important;
  color: var(--cyan) !important;
  background: var(--cyan-glow) !important;
}

.delete-btn {
  border-color: rgba(245, 63, 63, 0.3) !important;
  color: #f53f3f !important;
}
.delete-btn:hover {
  background: rgba(245, 63, 63, 0.12) !important;
  border-color: #f53f3f !important;
}

/* ============================================
   BODY LAYOUT
   ============================================ */
.kb-body {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 1px;
  background: var(--border-subtle);
}

/* ============================================
   SIDEBAR — FILE TREE
   ============================================ */
.kb-sidebar {
  width: 300px;
  min-width: 300px;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.file-count {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
}

/* --- Custom Search --- */
.search-wrap {
  position: relative;
  margin: 8px 12px 10px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 7px 28px 7px 32px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
  outline: none;
  transition: var(--transition);
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--cyan);
  background: rgba(15, 155, 142, 0.06);
  box-shadow: 0 0 0 3px var(--cyan-glow);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  border-radius: 3px;
  transition: var(--transition);
}
.search-clear:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.06);
}

/* --- File Tree --- */
.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 16px;
}

/* Scrollbar */
.file-tree::-webkit-scrollbar {
  width: 4px;
}
.file-tree::-webkit-scrollbar-track {
  background: transparent;
}
.file-tree::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
}
.file-tree::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.15);
}

/* --- Tree Node --- */
.tree-node {
  user-select: none;
}

.tree-row {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  margin-bottom: 1px;
  transition: all var(--transition);
  position: relative;
  gap: 4px;
}

.tree-row:hover {
  background: rgba(15, 155, 142, 0.08);
}

.tree-row:hover .tree-name {
  color: var(--text-primary);
}

.tree-row.selected {
  background: rgba(15, 155, 142, 0.14);
  box-shadow: inset 3px 0 0 var(--cyan);
}

.tree-row.selected .tree-name {
  color: var(--cyan);
  font-weight: 500;
}

/* Arrow */
.tree-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 8px;
  color: var(--text-muted);
  transition: transform var(--transition);
  flex-shrink: 0;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
  color: var(--amber);
}

.tree-arrow.hidden {
  visibility: hidden;
}

/* Icon */
.tree-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-right: 4px;
  line-height: 1;
}

.dir-icon {
  filter: none;
}

/* Name */
.tree-name {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color var(--transition);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Children indent */
.tree-children {
  margin-left: 20px;
  position: relative;
}

.tree-children::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, var(--border-hover) 0%, transparent 100%);
}

/* --- Skeleton --- */
.tree-skeleton {
  padding: 8px 12px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  opacity: 0;
  animation: skeletonFadeIn 0.4s ease forwards;
}

.skeleton-icon {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
}

.skeleton-text {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes skeletonFadeIn {
  to { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  gap: 8px;
}

.tree-empty .arco-icon {
  font-size: 32px;
}

.tree-empty p {
  margin: 0;
  font-size: 13px;
}

/* ============================================
   EDITOR
   ============================================ */
.kb-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  position: relative;
}

/* --- Placeholder --- */
.editor-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.placeholder-icon-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.placeholder-icon {
  font-size: 56px;
  color: var(--cyan);
  opacity: 0.5;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 20px var(--cyan-glow));
}

.placeholder-icon-bg {
  position: absolute;
  font-size: 80px;
  color: var(--cyan);
  opacity: 0.06;
  z-index: 0;
  animation: floatBg 4s ease-in-out infinite;
}

@keyframes floatBg {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}

.placeholder-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.placeholder-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

/* --- Editor Toolbar --- */
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(15, 15, 26, 0.6);
  border-bottom: 1px solid var(--border-subtle);
  gap: 12px;
  flex-shrink: 0;
}

.editor-filename {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.editor-filename .file-icon {
  color: var(--cyan);
  font-size: 14px;
  flex-shrink: 0;
}

.filename-text {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--cyan);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.unsaved-tag {
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 0 8px !important;
  line-height: 20px !important;
  border: none !important;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.editor-status {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.save-btn {
  font-family: var(--font-sans);
  font-weight: 600 !important;
  border-radius: var(--radius-sm) !important;
  transition: var(--transition) !important;
}

/* --- Tabs --- */
.editor-tabs-wrap {
  display: flex;
  padding: 0 16px;
  gap: 0;
  background: rgba(15, 15, 26, 0.4);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  flex-shrink: 0;
}

.editor-tab {
  position: relative;
  z-index: 1;
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-tab:hover {
  color: var(--text-secondary);
}

.editor-tab.active {
  color: var(--cyan);
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 2px;
  background: var(--cyan);
  transition: left var(--transition);
  border-radius: 2px 2px 0 0;
}

/* --- Editor Content --- */
.editor-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-content.is-preview {
  background: var(--bg-deep);
}

/* Textarea */
.markdown-editor {
  width: 100%;
  height: 100%;
  padding: 20px 24px;
  background: rgba(15, 15, 26, 0.6);
  color: var(--text-primary);
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.7;
  tab-size: 2;
  box-sizing: border-box;
}

.markdown-editor::placeholder {
  color: var(--text-muted);
}

.markdown-editor:focus {
  background: rgba(15, 15, 26, 0.8);
}

.markdown-editor:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.index-tag {
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 0 8px !important;
  line-height: 20px !important;
  border: 1px solid rgba(230, 168, 23, 0.3) !important;
  background: rgba(230, 168, 23, 0.1) !important;
}

/* Preview */
.markdown-preview {
  height: 100%;
  padding: 24px 32px;
  overflow-y: auto;
  line-height: 1.8;
  font-size: 14px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.markdown-preview::-webkit-scrollbar {
  width: 4px;
}
.markdown-preview::-webkit-scrollbar-track {
  background: transparent;
}
.markdown-preview::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-weight: 600;
  margin: 24px 0 12px;
  line-height: 1.3;
}

.markdown-preview :deep(h1) {
  font-size: 26px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 10px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--text-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.markdown-preview :deep(h2) {
  font-size: 20px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 6px;
}

.markdown-preview :deep(h3) { font-size: 17px; color: var(--cyan); }
.markdown-preview :deep(h4) { font-size: 15px; color: var(--amber); }

.markdown-preview :deep(code) {
  background: rgba(15, 155, 142, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cyan);
}

.markdown-preview :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  margin: 16px 0;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.6;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid var(--cyan);
  padding: 8px 16px;
  margin: 12px 0;
  background: rgba(15, 155, 142, 0.04);
  color: var(--text-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.markdown-preview :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-hover), transparent);
  margin: 24px 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 24px;
}

.markdown-preview :deep(li) {
  margin: 4px 0;
}

.markdown-preview :deep(a) {
  color: var(--cyan);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition);
}

.markdown-preview :deep(a:hover) {
  border-bottom-color: var(--cyan);
}

.markdown-preview :deep(strong) {
  color: var(--amber);
  font-weight: 600;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 13px;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  text-align: left;
}

.markdown-preview :deep(th) {
  background: rgba(15, 155, 142, 0.08);
  color: var(--cyan);
  font-weight: 600;
}

.markdown-preview :deep(tr:nth-child(even)) {
  background: rgba(255,255,255,0.02);
}

/* --- Modal --- */
.kb-modal .arco-modal {
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-hover) !important;
  border-radius: var(--radius-lg) !important;
}

.kb-modal .arco-modal-header {
  border-bottom-color: var(--border-subtle) !important;
}

.kb-modal .arco-modal-title {
  color: var(--text-primary) !important;
  font-family: var(--font-sans) !important;
  font-weight: 600 !important;
}

.kb-modal .arco-form-item-label {
  color: var(--text-secondary) !important;
  font-family: var(--font-sans) !important;
  font-size: 13px !important;
}

.kb-modal .arco-input {
  background: rgba(255,255,255,0.04) !important;
  border-color: var(--border-subtle) !important;
  color: var(--text-primary) !important;
  font-family: var(--font-sans) !important;
}

.kb-modal .arco-input:focus {
  border-color: var(--cyan) !important;
  box-shadow: 0 0 0 3px var(--cyan-glow) !important;
}
</style>
