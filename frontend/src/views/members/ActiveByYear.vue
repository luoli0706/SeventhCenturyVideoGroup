<template>
  <a-card title="社团每年在役成员名单" style="margin-top: 24px;">
    <a-space direction="vertical" size="large" fill>
      <router-link to="/members/active-by-year/2024">
        <a-button long>2024年</a-button>
      </router-link>
      <router-link to="/members/active-by-year/2025">
        <a-button long>2025年</a-button>
      </router-link>
      <router-link to="/members/active-by-year/2026">
        <a-button long>2026年</a-button>
      </router-link>
    </a-space>
  </a-card>
</template>