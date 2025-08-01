<template>
  <a-card title="社团现役成员名单" style="margin-top: 24px;">
    <div v-if="members.length === 0">暂无现役成员</div>
    <div v-else>
      <div
        v-for="member in members"
        :key="member.ID"
        class="member-block"
        style="margin-bottom: 12px;"
      >
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
    <a-button style="margin-top: 16px;" @click="goBack">返回成员名单</a-button>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const members = ref([])

function goBack() {
  router.push('/members')
}

onMounted(async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/club_members`)
    members.value = res.data.filter(m => m.Status === '仍然在役')
  } catch (e) {
    members.value = []
  }
})
</script>

<style scoped>
.member-block {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--color-bg-2, #f6f6f6);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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