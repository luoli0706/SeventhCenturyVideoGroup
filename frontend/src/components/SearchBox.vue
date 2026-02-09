<template>
  <a-select
    v-model="selectedRoute"
    placeholder="搜索路由入口..."
    style="width: 300px; margin-bottom: 24px;"
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { apiUrl } from '../utils/apiUrl'

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

// 加载成员列表到搜索选项
onMounted(async () => {
  try {
    const res = await axios.get(apiUrl('/api/club_members'))
    const memberOptions = res.data.map(member => ({
      label: `${member.cn} (${member.direction})`,
      value: `/member/${encodeURIComponent(member.cn)}`
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