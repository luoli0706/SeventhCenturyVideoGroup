<template>
  <div class="edit-profile-page">
    <a-card :title="`完善 ${memberName} 的个人主页`" style="max-width: 500px; margin: 0 auto;">
      <a-form :model="form" layout="vertical">
        <a-form-item label="头像">
          <a-upload
            v-model:file-list="avatarFileList"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :auto-upload="false"
          >
            <div v-if="avatarFileList.length === 0">
              <div>上传头像</div>
            </div>
          </a-upload>
        </a-form-item>
        
        <a-form-item label="B站UID">
          <a-input 
            v-model="form.biliUID" 
            placeholder="请输入B站UID" 
            allow-clear
          />
        </a-form-item>
        
        <a-form-item label="个性签名">
          <a-textarea 
            v-model="form.signature" 
            placeholder="写下你的个性签名..." 
            :max-length="200"
            show-word-limit
            :auto-size="{ minRows: 3, maxRows: 5 }"
          />
        </a-form-item>
        
        <a-form-item label="代表作BV号（可选）">
          <a-input 
            v-model="form.representativeWork" 
            placeholder="如：BV1xx4y1x7Tp" 
            allow-clear
          />
        </a-form-item>
        
        <a-form-item label="其他信息（可选）">
          <a-textarea 
            v-model="form.other" 
            placeholder="其他想要展示的信息..." 
            :max-length="500"
            show-word-limit
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>
        
        <a-space style="margin-top: 16px; width: 100%; justify-content: center;">
          <a-button @click="goBack">取消</a-button>
          <a-button type="primary" @click="handleSubmit">提交</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const memberName = ref('')
const avatarFileList = ref([])

const form = reactive({
  biliUID: '',
  signature: '',
  representativeWork: '',
  other: ''
})

function goBack() {
  router.back()
}

async function handleSubmit() {
  try {
    const profileData = {
      CN: memberName.value,
      Avatar: avatarFileList.value[0] ? avatarFileList.value[0].name : '', // 简化处理，实际应上传文件
      BiliUID: form.biliUID,
      Signature: form.signature,
      RepresentativeWork: form.representativeWork,
      Other: form.other
    }
    
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/member-profile/${encodeURIComponent(memberName.value)}`,
      profileData
    )
    
    if (res.status === 200 || res.status === 201) {
      alert('个人主页信息已保存！')
      router.push(`/member/${encodeURIComponent(memberName.value)}`)
    }
    
  } catch (e) {
    alert('提交失败，请重试')
    console.error('提交失败:', e)
  }
}

onMounted(() => {
  memberName.value = decodeURIComponent(route.params.name)
  loadExistingProfile()
})

// 加载已有的个人主页数据
async function loadExistingProfile() {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/member-profile/${encodeURIComponent(memberName.value)}`)
    const data = res.data
    
    form.biliUID = data.BiliUID || ''
    form.signature = data.Signature || ''
    form.representativeWork = data.RepresentativeWork || ''
    form.other = data.Other || ''
    
    // 如果有头像，显示现有头像（简化处理）
    if (data.Avatar) {
      // 这里可以根据需要处理现有头像的显示
    }
  } catch (e) {
    // 如果没有找到个人主页数据，保持表单为空
    console.log('没有找到现有的个人主页数据，将创建新的')
  }
}
</script>

<style scoped>
.edit-profile-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80vh;
  padding-top: 2rem;
}
</style>
