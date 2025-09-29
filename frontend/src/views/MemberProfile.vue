<template>
  <div class="member-profile-page">
    <a-card :title="`${memberName} 的个人主页`" style="max-width: 600px; margin: 0 auto;">
      <div v-if="!profileExists" class="default-info">
        <div class="info-item">
          <strong>姓名：</strong>{{ memberInfo.CN || memberName }}
        </div>
        <div class="info-item">
          <strong>方向：</strong>{{ memberInfo.Direction || '暂无信息' }}
        </div>
        <div class="info-item">
          <strong>职务：</strong>{{ memberInfo.Position || '暂无信息' }}
        </div>
        <div class="no-profile-tip">
          <a-empty description="该成员尚未完善个人主页">
            <a-button v-if="canEdit" type="primary" @click="handleEditProfile">完善个人主页</a-button>
            <span v-else style="color: #999;">该成员尚未完善个人主页</span>
          </a-empty>
        </div>
      </div>
      
      <div v-else class="profile-content">
        <div class="profile-item" v-if="profileData.Avatar">
          <strong>头像：</strong>
          <img :src="`${apiBaseUrl}/${profileData.Avatar}`" alt="头像" class="avatar-img" />
        </div>
        <div class="profile-item" v-if="profileData.BiliUID">
          <strong>B站UID：</strong>{{ profileData.BiliUID }}
        </div>
        <div class="profile-item" v-if="profileData.Signature">
          <strong>个性签名：</strong>{{ profileData.Signature }}
        </div>
        <div class="profile-item" v-if="profileData.RepresentativeWork">
          <strong>代表作BV号：</strong>{{ profileData.RepresentativeWork }}
        </div>
        <div class="profile-item" v-if="profileData.Other">
          <strong>其他信息：</strong>{{ profileData.Other }}
        </div>
      </div>
      
      <a-space style="margin-top: 24px;">
        <a-button @click="goBack">返回成员列表</a-button>
        <a-button v-if="canEdit" type="primary" @click="handleEditProfile">{{ profileExists ? '编辑主页' : '完善主页' }}</a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { auth } from '../utils/auth'

const router = useRouter()
const route = useRoute()
const memberName = ref('')
const memberInfo = ref({})
const profileExists = ref(false)
const profileData = ref({})
const canEdit = ref(false) // 新增：是否可以编辑的权限标志

// 定义API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

function goBack() {
  router.back()
}

// 检查用户是否有编辑权限
function checkEditPermission() {
  // 检查是否为社团成员
  if (!auth.isMember()) {
    return false
  }
  
  // 获取当前登录用户信息
  const currentUser = auth.getUserInfo()
  if (!currentUser || !currentUser.cn) {
    return false
  }
  
  // 检查是否为本人
  return currentUser.cn === memberName.value
}

// 处理编辑个人主页的权限检查
function handleEditProfile() {
  // 检查是否为社团成员
  if (!auth.isMember()) {
    alert('只有社团成员才能完善个人主页')
    return
  }
  
  // 获取当前登录用户信息
  const currentUser = auth.getUserInfo()
  if (!currentUser || !currentUser.cn) {
    alert('获取用户信息失败，请重新登录')
    return
  }
  
  // 检查是否为本人
  if (currentUser.cn !== memberName.value) {
    alert('您无权修改该主页')
    return
  }
  
  // 权限检查通过，跳转到编辑页面
  router.push(`/member/${encodeURIComponent(memberName.value)}/edit`)
}

// 检查个人主页是否存在
async function checkProfileExists() {
  try {
    const res = await axios.get(`${apiBaseUrl}/api/member-profile/${encodeURIComponent(memberName.value)}/exists`)
    return res.data.exists
  } catch (e) {
    return false
  }
}

// 获取个人主页数据
async function getProfileData() {
  try {
    const res = await axios.get(`${apiBaseUrl}/api/member-profile/${encodeURIComponent(memberName.value)}`)
    return res.data
  } catch (e) {
    return null
  }
}

onMounted(async () => {
  memberName.value = decodeURIComponent(route.params.name)
  
  // 检查编辑权限
  canEdit.value = checkEditPermission()
  
  // 获取成员基本信息
  try {
    const res = await axios.get(`${apiBaseUrl}/api/club_members`)
    const member = res.data.find(m => m.CN === memberName.value)
    if (member) {
      memberInfo.value = member
    }
  } catch (e) {
    console.error('获取成员信息失败', e)
  }
  
  // 检查是否存在个人主页信息
  profileExists.value = await checkProfileExists()
  
  if (profileExists.value) {
    const data = await getProfileData()
    if (data) {
      profileData.value = data
    }
  }
})
</script>

<style scoped>
.member-profile-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80vh;
  padding-top: 2rem;
}
.default-info {
  text-align: center;
}
.info-item {
  margin-bottom: 12px;
  font-size: 1.1em;
}
.no-profile-tip {
  margin-top: 2rem;
}
.profile-content {
  text-align: left;
}
.profile-item {
  margin-bottom: 16px;
  font-size: 1.1em;
}
.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-left: 8px;
}
</style>
