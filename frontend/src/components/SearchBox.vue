<template>
  <div class="search-shell">
    <a-select
      v-model="selectedRoute"
      placeholder="请输入文本"
      :style="{ width: '100%' }"
      allow-search
      allow-clear
      @change="handleRouteChange"
    >
      <a-option
        v-for="route in routeOptions"
        :key="route.value"
        :value="route.value"
      >
        {{ route.label }}
      </a-option>
    </a-select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()
const selectedRoute = ref('')
const routeOptions = ref([
  { label: '社团成员名单', value: '/members' },
  { label: '社团活动事件', value: '/events' },
  { label: '社团招新', value: '/recruit' },
  { label: '登记信息', value: '/register' },
  { label: '动画系', value: '/animation' },
  { label: '静止系', value: '/static' },
  { label: '三维', value: '/3d' },
  { label: '名人堂（过往所有成员名单）', value: '/members/all-years' },
  { label: '社团现役成员名单', value: '/members/current' },
  { label: '上传活动', value: '/events/upload' }
])

onMounted(async () => {
  try {
    const res = await api.get('/api/club_members')
    const memberOptions = res.data.map(member => ({
      label: `${member.CN} (${member.Direction})`,
      value: `/member/${encodeURIComponent(member.CN)}`
    }))
    routeOptions.value.push(...memberOptions)
  } catch (e) {
    console.error('加载成员列表失败', e)
  }
})

function handleRouteChange(value) {
  if (value) {
    router.push(value)
    selectedRoute.value = ''
  }
}
</script>

<style scoped>
.search-shell {
  width: 100%;
  transition: transform 0.4s ease;
}

.search-shell:focus-within {
  transform: translateY(-1px);
}

/* ── Arco Select Overrides ── */
.search-shell :deep(.arco-select) {
  background: rgba(255,255,255,0.01) !important;
  border: 1px solid rgba(255,255,255,0.04) !important;
  border-radius: 12px !important;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  padding: 6px 12px !important;
}

.search-shell :deep(.arco-select:hover) {
  border-color: rgba(15,155,142,0.08) !important;
}

.search-shell :deep(.arco-select.arco-select-focus) {
  border-color: rgba(15,155,142,0.08) !important;
  background: rgba(15,155,142,0.01) !important;
  box-shadow: 0 0 0 1px rgba(15,155,142,0.04), 0 4px 24px rgba(15,155,142,0.04) !important;
}

.search-shell :deep(.arco-select-view) {
  color: rgba(255,255,255,0.5) !important;
  font-size: 14px !important;
  transition: color 0.4s ease !important;
}

.search-shell :deep(.arco-select.arco-select-focus .arco-select-view) {
  color: rgba(255,255,255,0.8) !important;
}

.search-shell :deep(.arco-select-placeholder) {
  color: rgba(255,255,255,0.06) !important;
  transition: color 0.4s ease !important;
}

.search-shell :deep(.arco-select.arco-select-focus .arco-select-placeholder) {
  color: rgba(255,255,255,0.12) !important;
}

.search-shell :deep(.arco-icon-close) {
  color: rgba(255,255,255,0.08) !important;
  transition: color 0.3s ease !important;
}

.search-shell :deep(.arco-icon-close:hover) {
  color: rgba(255,255,255,0.25) !important;
}

/* ── Light mode ── */
.theme-light .search-shell :deep(.arco-select) {
  background: rgba(255,255,255,0.6) !important;
  border-color: rgba(0,0,0,0.04) !important;
}

.theme-light .search-shell :deep(.arco-select:hover) {
  border-color: rgba(15,155,142,0.06) !important;
}

.theme-light .search-shell :deep(.arco-select.arco-select-focus) {
  border-color: rgba(15,155,142,0.08) !important;
  background: #fff !important;
  box-shadow: 0 0 0 1px rgba(15,155,142,0.04), 0 4px 20px rgba(15,155,142,0.03) !important;
}

.theme-light .search-shell :deep(.arco-select-view) {
  color: rgba(0,0,0,0.35) !important;
}

.theme-light .search-shell :deep(.arco-select.arco-select-focus .arco-select-view) {
  color: rgba(0,0,0,0.6) !important;
}

.theme-light .search-shell :deep(.arco-select-placeholder) {
  color: rgba(0,0,0,0.04) !important;
}

.theme-light .search-shell :deep(.arco-select.arco-select-focus .arco-select-placeholder) {
  color: rgba(0,0,0,0.08) !important;
}

.theme-light .search-shell :deep(.arco-icon-close) {
  color: rgba(0,0,0,0.06) !important;
}

.theme-light .search-shell :deep(.arco-icon-close:hover) {
  color: rgba(0,0,0,0.18) !important;
}
</style>
