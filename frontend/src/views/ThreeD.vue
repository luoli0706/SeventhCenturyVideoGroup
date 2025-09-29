<template>
  <div class="threed-page">
    <a-card title="三维">
      <p>这里是三维的相关内容...</p>
      <a-button @click="goBack" style="margin-top: 16px;">返回主页</a-button>
    </a-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  router.push('/home')
}
</script>

<style scoped>
.threed-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
</style>