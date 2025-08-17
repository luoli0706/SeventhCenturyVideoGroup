<template>
  <div :class="['bg-wrapper', isDark ? 'bg-dark' : 'bg-light']">
    <!-- 右上角圣诞树链接 -->
    <div class="christmas-link">
      <a href="http://7thcv.cn:721/" target="_blank" rel="noopener noreferrer" title="访问特别页面">
        🎄
      </a>
    </div>
    
    <div class="side-img left"></div>
    <div class="home-bg">
      <div class="content-wrapper">
        <div class="department-links">
          <a-space direction="horizontal" size="large">
            <router-link to="/animation">
              <a-button type="outline" size="small">动画系</a-button>
            </router-link>
            <router-link to="/static">
              <a-button type="outline" size="small">静止系</a-button>
            </router-link>
            <router-link to="/3d">
              <a-button type="outline" size="small">三维</a-button>
            </router-link>
          </a-space>
        </div>
        <a-divider style="margin: 16px 0; width: 280px;" />
        <ThemeSwitcher />
        <Title />
        <SearchBox />
        <HomeMenu :is-dark="isDark" />
      </div>
    </div>
    <div class="side-img right"></div>
    <div class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        闽ICP备2025101374号
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Title from '../components/Title.vue'
import SearchBox from '../components/SearchBox.vue'
import HomeMenu from '../components/HomeMenuNew.vue'
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
  position: relative;
}

.christmas-link {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.christmas-link a {
  display: inline-block;
  font-size: 32px;
  text-decoration: none;
  transition: transform 0.3s ease;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
}

.christmas-link a:hover {
  transform: scale(1.2) rotate(5deg);
  filter: drop-shadow(2px 2px 8px rgba(0,0,0,0.5));
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
  background-position: center right;
}
.side-img.right {
  transform: scaleX(-1);
  background-position: center left;
}
.home-bg {
  flex: 2 1 600px;
  min-width: 350px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  z-index: 1;
  padding-top: 15vh;
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.department-links {
  margin-bottom: 8px;
}
.department-links .arco-btn {
  font-size: 0.9em;
  padding: 6px 16px;
}
.icp-footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  text-align: center;
  padding: 8px 0;
  background: rgba(255,255,255,0.7);
  font-size: 0.95em;
  z-index: 99;
}
.icp-footer a {
  color: #165dff;
  text-decoration: none;
}
.icp-footer a:hover {
  text-decoration: underline;
}
</style>