<template>
  <a-card title="各届成员名单" style="margin-top: 24px;">
    <a-space direction="vertical" size="large" fill>
      <router-link to="/members/all-years/2025">
        <a-button long>2025级</a-button>
      </router-link>
      <router-link to="/members/all-years/2024">
        <a-button long>2024级</a-button>
      </router-link>
      <router-link to="/members/all-years/2023">
        <a-button long>2023级</a-button>
      </router-link>
      <router-link to="/members/all-years/2022">
        <a-button long>2022级</a-button>
      </router-link>
      <router-link to="/members/all-years/2021">
        <a-button long>2021级</a-button>
      </router-link>
      <router-link to="/members/all-years/2020">
        <a-button long>2020级及往届</a-button>
      </router-link>
    </a-space>
  </a-card>
</template>