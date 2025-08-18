<template>
  <div class="animation-page">
    <a-card title="动画系">
      <p>这里是动画系的相关内容...</p>
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
.animation-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
</style>