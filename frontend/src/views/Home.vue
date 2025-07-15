<template>
  <div :class="['bg-wrapper', isDark ? 'bg-dark' : 'bg-light']">
    <div class="side-img left"></div>
    <div class="home-bg">
      <ThemeSwitcher />
      <Title />
      <SearchBox />
      <HomeMenu :is-dark="isDark" />
    </div>
    <div class="side-img right"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Title from '../components/Title.vue'
import SearchBox from '../components/SearchBox.vue'
import HomeMenu from '../components/HomeMenu.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'

const isDark = ref(false)

const updateTheme = () => {
  isDark.value = document.body.getAttribute('arco-theme') === 'dark'
}

onMounted(() => {
  updateTheme()
  // 监听属性变化
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.body, { attributes: true, attributeFilter: ['arco-theme'] })
})
</script>

<style scoped>
.bg-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition: background 0.3s;
}
.bg-light {
  background: #fff;
}
.bg-dark {
  background: #000;
}
.side-img {
  flex: 1 1 0;
  background-image: url('/视小姬.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto 100%;
  min-width: 0;
  min-height: 100vh;
}
.side-img.left {
}
.side-img.right {
  transform: scaleX(-1);
}
.home-bg {
  flex: 2 1 600px;
  min-width: 350px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  z-index: 1;
}
</style>