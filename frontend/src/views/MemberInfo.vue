<template>
  <div class="member-info-page">
    <a-card title="登记成员信息" style="max-width: 400px; margin: 0 auto;">
      <a-form :model="form" layout="vertical">
        <a-form-item label="姓名（cn）" required>
          <a-input v-model="form.cn" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="性别">
          <a-select v-model="form.gender" placeholder="请选择性别" allow-clear>
            <a-option value="男">男</a-option>
            <a-option value="女">女</a-option>
            <a-option value="其他">其他</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="职务">
          <a-input v-model="form.position" placeholder="请输入职务" />
        </a-form-item>
        <a-form-item label="入学年份">
          <a-input v-model="form.year" placeholder="如2025" />
        </a-form-item>
        <a-form-item label="方向">
          <a-select v-model="form.direction" placeholder="请选择方向">
            <a-option value="动画">动画</a-option>
            <a-option value="静止系">静止系</a-option>
            <a-option value="三维">三维</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="在役状态" required>
          <a-select v-model="form.status" placeholder="请选择在役状态">
            <a-option value="仍然在役">仍然在役</a-option>
            <a-option value="已退居幕后">已退居幕后</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="form.remark" placeholder="选填" />
        </a-form-item>
        <a-space style="margin-top: 16px;">
          <a-button @click="goBack">返回</a-button>
          <a-button type="primary" @click="handleSubmit">提交</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 定义API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const form = reactive({
  cn: '',
  gender: '',
  position: '',
  year: '',
  direction: '',
  status: '',
  remark: ''
})

// 检查用户权限
onMounted(() => {
  const userType = localStorage.getItem('userType')
  const userInfo = localStorage.getItem('userInfo')
  
  if (userType !== 'member' || !userInfo) {
    alert('访客无法访问该功能')
    router.push('/home')
    return
  }
  
  const user = JSON.parse(userInfo)
  if (!user.is_member) {
    alert('访客无法访问该功能')
    router.push('/home')
    return
  }
})

function goBack() {
  router.back()
}

async function handleSubmit() {
  try {
    const token = localStorage.getItem('token')
    
    await axios.post(`${apiBaseUrl}/api/club_members`, form, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    alert('提交成功！')
    router.back()
  } catch (e) {
    if (e.response?.status === 403) {
      alert('访客无法访问该功能')
      router.push('/home')
    } else {
      alert('提交失败，请重试')
    }
    console.error('提交失败:', e)
  }
}
</script>

<style scoped>
.member-info-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding-top: 2rem;
}
</style>
