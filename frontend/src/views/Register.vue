<template>
  <div class="register-page">
    <a-card title="登记信息" style="max-width: 400px; margin: 0 auto;">
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
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({
  cn: '',
  gender: '',
  position: '',
  year: '',
  direction: '',
  remark: ''
})

function goBack() {
  router.push('/members')
}

function handleSubmit() {
  // 处理提交逻辑，暂为空
  router.push('/members')
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
</style>