<template>
  <div class="members-page">
    <img src="/视频组合照2025.png" alt="视频组合照2025" class="group-photo" />
    <a-card title="社团成员名单">
      <a-space direction="vertical" size="large" fill>
        <router-link to="/members/all-years">
          <a-button long type="primary">各届成员名单</a-button>
        </router-link>
        <router-link to="/members/current">
          <a-button long type="primary">社团现役成员名单</a-button>
        </router-link>
        <router-link to="/members/active-by-year">
          <a-button long type="primary">社团每年在役成员名单</a-button>
        </router-link>
        <router-link to="/register">
          <a-button long type="primary">登记信息</a-button>
        </router-link>
        <a-button @click="goBack" style="margin-top: 16px;">返回主页面</a-button>
      </a-space>
    </a-card>
    <router-view />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  router.push('/')
}
</script>

<style scoped>
.members-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
}
.group-photo {
  width: 320px;
  max-width: 90vw;
  margin-bottom: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}
</style>