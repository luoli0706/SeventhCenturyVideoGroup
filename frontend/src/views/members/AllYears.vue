<template>
  <div class="all-years-page">
    <a-card title="名人堂（过往所有成员名单）">
      <a-scrollbar class="member-scrollbar">
        <div class="member-list">
          <div v-for="member in members" :key="member.ID" class="member-block">
            <router-link :to="`/member/${encodeURIComponent(member.CN)}`" class="member-name-link">
              <div class="member-name">{{ member.CN }}</div>
            </router-link>
            <div class="member-info">
              <span>性别：{{ member.Sex }}</span>
              <span>职务：{{ member.Position }}</span>
              <span>入学年份：{{ member.Year }}</span>
              <span>方向：{{ member.Direction }}</span>
            </div>
            <div class="member-remark">备注：{{ member.Remark }}</div>
          </div>
        </div>
      </a-scrollbar>
      <a-space style="margin-top: 24px;">
        <a-button @click="goBack">返回成员名单</a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { apiUrl } from '../../utils/apiUrl'

const router = useRouter()
const members = ref([])

function goBack() {
  router.push('/members')
}

onMounted(async () => {
  try {
    const res = await axios.get(apiUrl('/api/club_members'))
    members.value = res.data
  } catch (e) {
    members.value = []
  }
})
</script>

<style scoped>
.all-years-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
}
.member-scrollbar {
  max-height: 400px;
  min-height: 200px;
  width: 100%;
  margin-bottom: 8px;
}
.member-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
  align-items: center;
}
.member-block {
  width: 100%;
  max-width: 520px;
  min-width: 220px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-bg-2, #f6f6f6);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.member-block:hover {
  box-shadow: 0 4px 16px rgba(22,93,255,0.08);
}
.member-name {
  font-weight: bold;
  font-size: 1.1em;
}
.member-info {
  color: #888;
  margin: 4px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.member-remark {
  margin-top: 4px;
  color: #666;
  font-size: 0.95em;
}
.member-name-link {
  text-decoration: none;
  color: inherit;
}
.member-name-link:hover .member-name {
  color: #165dff;
  cursor: pointer;
}
</style>