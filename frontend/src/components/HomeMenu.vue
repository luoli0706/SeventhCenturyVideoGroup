<template>
  <a-space direction="horizontal" size="large" style="margin-top: 2em;">
    <router-link to="/members">
      <a-button
        :type="isDark ? 'secondary' : 'primary'"
        :class="isDark ? 'dark-btn' : 'light-btn'"
      >社团成员名单</a-button>
    </router-link>
    <router-link to="/events">
      <a-button
        :type="isDark ? 'secondary' : 'primary'"
        :class="isDark ? 'dark-btn' : 'light-btn'"
      >社团活动事件</a-button>
    </router-link>
    <router-link to="/recruit">
      <a-button
        :type="isDark ? 'secondary' : 'primary'"
        :class="isDark ? 'dark-btn' : 'light-btn'"
      >社团招新</a-button>
    </router-link>
    <router-link to="/register">
      <a-button
        :type="isDark ? 'secondary' : 'primary'"
        :class="isDark ? 'dark-btn' : 'light-btn'"
      >登记信息</a-button>
    </router-link>
  </a-space>
</template>

<script setup>
defineProps({
  isDark: Boolean
})
</script>

<style scoped>
.dark-btn {
  background: #232324 !important;
  color: #fff !important;
  border: none;
}
.light-btn {
  background: #fff !important;
  color: #165dff !important;
  border: 1px solid #165dff !important;
}
</style>