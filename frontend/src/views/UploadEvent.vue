<template>
  <div class="upload-event-page">
    <a-card title="上传活动" style="max-width: 400px; margin: 0 auto;">
      <a-form :model="form" layout="vertical">
        <a-form-item label="活动名称" required>
          <a-input v-model="form.name" placeholder="请输入活动名称" />
        </a-form-item>
        <a-form-item label="活动时间" required>
          <a-date-picker
            v-model="form.time"
            style="width: 100%;"
            :time-picker="false"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
          />
        </a-form-item>
        <a-form-item label="活动内容" required>
          <a-input v-model="form.content" placeholder="请输入活动内容" />
        </a-form-item>
        <a-form-item label="活动详情">
          <a-input v-model="form.detail" placeholder="可选，活动详情" />
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
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const form = reactive({
  name: '',
  time: '',
  content: '',
  detail: ''
})

function goBack() {
  router.back()
}

async function handleSubmit() {
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/activities`, form)
    router.push('/events')
  } catch (e) {
    alert('提交失败')
  }
}
</script>

<style scoped>
.upload-event-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
</style>