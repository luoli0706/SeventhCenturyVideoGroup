<template>
  <div class="profile-page">
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-dots"></div>
    </div>

    <nav class="page-nav">
      <button class="nav-back" @click="goBack">
        <span class="nav-arrow">←</span> 返回
      </button>
      <button v-if="canEdit" class="nav-edit" @click="handleEditProfile">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
        {{ profileExists ? '编辑主页' : '完善主页' }}
      </button>
    </nav>

    <main class="page-content">
      <!-- Hero -->
      <header class="hero">
        <div class="hero-avatar-wrap">
          <div class="hero-avatar-ring"></div>
          <div class="hero-avatar" v-if="profileData.Avatar">
            <img :src="`https://7thcv.cn/${profileData.Avatar}`" :alt="memberName" class="avatar-img" />
          </div>
          <div class="hero-avatar hero-avatar-text" v-else>
            <span>{{ memberName ? memberName[0] : '?' }}</span>
          </div>
        </div>
        <h1 class="hero-name">{{ memberInfo.CN || memberName }}</h1>
        <div class="hero-tags" v-if="memberInfo.Direction || memberInfo.Position || memberInfo.Year">
          <span class="ht-tag tag-direction" v-if="memberInfo.Direction">{{ memberInfo.Direction }}</span>
          <span class="ht-tag tag-position" v-if="memberInfo.Position">{{ memberInfo.Position }}</span>
          <span class="ht-tag tag-year" v-if="memberInfo.Year">{{ memberInfo.Year }}</span>
          <span class="ht-tag tag-status" v-if="memberInfo.Status === '仍然在役'">在役</span>
          <span class="ht-tag tag-sex" v-if="memberInfo.Sex">{{ memberInfo.Sex === '男' ? '♂' : '♀' }}</span>
        </div>
      </header>

      <!-- Profile exists -->
      <template v-if="profileExists && profileData">
        <section class="profile-section">
          <!-- Signature -->
          <div class="info-card signature-card" v-if="profileData.Signature">
            <div class="ic-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 16l2-2 3 3L17 9l-3-3-7 7-3 3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M12 4l4 4" stroke="currentColor" stroke-width="1.2"/>
              </svg>
            </div>
            <div class="ic-body">
              <span class="ic-label">个性签名</span>
              <p class="ic-value signature-text">「{{ profileData.Signature }}」</p>
            </div>
          </div>

          <div class="info-grid">
            <!-- Bili UID -->
            <div class="info-card" v-if="profileData.BiliUID">
              <div class="ic-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="10" cy="11" r="3" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M7 5V3h6v2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="ic-body">
                <span class="ic-label">B站 UID</span>
                <span class="ic-value">{{ profileData.BiliUID }}</span>
              </div>
            </div>

            <!-- Representative Work -->
            <div class="info-card" v-if="profileData.RepresentativeWork">
              <div class="ic-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5 5.1 17.2l.9-5.5-4-3.9L7.5 7 10 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="ic-body">
                <span class="ic-label">代表作</span>
                <span class="ic-value bv-value">{{ profileData.RepresentativeWork }}</span>
              </div>
            </div>

            <!-- Other info -->
            <div class="info-card info-card-full" v-if="profileData.Other">
              <div class="ic-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M10 6v4M10 13v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="ic-body">
                <span class="ic-label">其他信息</span>
                <p class="ic-value">{{ profileData.Other }}</p>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- No profile -->
      <template v-else>
        <section class="empty-section">
          <div class="empty-icon-circle">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="16" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 34c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 class="empty-title">个人主页暂未完善</h3>
          <p class="empty-desc">该成员还没有填写个人资料</p>
          <button v-if="canEdit" class="empty-cta" @click="handleEditProfile">
            立即完善 →
          </button>
        </section>
      </template>

      <!-- Remark from club_members -->
      <section class="remark-section" v-if="memberInfo.Remark">
        <div class="remark-line"></div>
        <p class="remark-text">{{ memberInfo.Remark }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../utils/api'
import { auth } from '../utils/auth'

const router = useRouter()
const route = useRoute()
const memberName = ref('')
const memberInfo = ref({})
const profileExists = ref(false)
const profileData = ref({})
const canEdit = ref(false)

function goBack() { router.back() }

function checkEditPermission() {
  if (!auth.isMember()) return false
  const currentUser = auth.getUserInfo()
  if (!currentUser || !currentUser.cn) return false
  return currentUser.cn === memberName.value
}

function handleEditProfile() {
  if (!auth.isMember()) { alert('只有社团成员才能完善个人主页'); return }
  const currentUser = auth.getUserInfo()
  if (!currentUser || !currentUser.cn) { alert('获取用户信息失败，请重新登录'); return }
  if (currentUser.cn !== memberName.value) { alert('您无权修改该主页'); return }
  router.push(`/member/${encodeURIComponent(memberName.value)}/edit`)
}

async function checkProfileExists() {
  try {
    const res = await api.get(`/api/member-profile/${encodeURIComponent(memberName.value)}/exists`)
    return res.data.exists
  } catch (e) { return false }
}

async function getProfileData() {
  try {
    const res = await api.get(`/api/member-profile/${encodeURIComponent(memberName.value)}`)
    return res.data
  } catch (e) { return null }
}

onMounted(async () => {
  memberName.value = decodeURIComponent(route.params.name)
  canEdit.value = checkEditPermission()

  try {
    const res = await api.get('/api/club_members')
    const member = res.data.find(m => m.CN === memberName.value)
    if (member) memberInfo.value = member
  } catch (e) {}

  profileExists.value = await checkProfileExists()
  if (profileExists.value) {
    const data = await getProfileData()
    if (data) profileData.value = data
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.profile-page {
  min-height: 100vh;
  background: #08081a;
  color: #e0e0ec;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  position: relative;
}
.bg-layer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.bg-gradient {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(15,155,142,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(230,168,23,0.03) 0%, transparent 50%);
}
.bg-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.005) 0.5px, transparent 0.5px);
  background-size: 48px 48px;
}

/* --- Nav --- */
.page-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px;
  background: rgba(8,8,26,0.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.nav-back {
  background: none; border: none;
  color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer;
  padding: 6px 12px; border-radius: 8px;
  transition: all 0.25s ease; font-family: inherit;
  display: flex; align-items: center; gap: 4px;
}
.nav-back:hover { color: #0f9b8e; background: rgba(15,155,142,0.08); }
.nav-arrow { display: inline-block; transition: transform 0.25s ease; }
.nav-back:hover .nav-arrow { transform: translateX(-3px); }

.nav-edit {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(15,155,142,0.15);
  color: #0f9b8e; font-size: 13px; font-weight: 600;
  padding: 6px 14px; border-radius: 8px;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.nav-edit:hover {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.3);
}

/* --- Content --- */
.page-content {
  position: relative; z-index: 1;
  max-width: 560px; margin: 0 auto;
  padding: 100px 24px 60px;
}

/* --- Hero --- */
.hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 50px 0 36px;
  animation: fadeUp 0.8s ease;
}
.hero-avatar-wrap {
  position: relative;
  margin-bottom: 20px;
}
.hero-avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(15,155,142,0.15);
  animation: ringPulse 3s ease-in-out infinite;
}
@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.05); opacity: 1; }
}
.hero-avatar {
  width: 96px; height: 96px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}
.avatar-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.hero-avatar-text {
  background: linear-gradient(135deg, rgba(15,155,142,0.12), rgba(230,168,23,0.08));
  border: 1px solid rgba(15,155,142,0.1);
  display: flex; align-items: center; justify-content: center;
}
.hero-avatar-text span {
  font-size: 2.4rem;
  font-weight: 700;
  color: rgba(15, 155, 142, 0.5);
}
.hero-name {
  font-size: 1.6rem; font-weight: 700;
  margin: 0 0 12px; letter-spacing: 1px;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.6));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-tags {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
}
.ht-tag {
  font-size: 11px; font-weight: 600;
  padding: 4px 12px; border-radius: 100px;
  letter-spacing: 0.5px;
}
.tag-direction {
  background: rgba(15, 155, 142, 0.08);
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.1);
}
.tag-position {
  background: rgba(230, 168, 23, 0.06);
  color: #e6a817;
  border: 1px solid rgba(230, 168, 23, 0.08);
}
.tag-year {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.04);
}
.tag-status {
  background: rgba(15, 155, 142, 0.06);
  color: #0f9b8e;
  border: 1px solid rgba(15, 155, 142, 0.08);
}
.tag-sex {
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.04);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Profile section --- */
.profile-section {
  animation: fadeUp 0.6s ease 0.15s backwards;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  margin-bottom: 10px;
  transition: all 0.3s ease;
}
.info-card:hover {
  border-color: rgba(15, 155, 142, 0.08);
  background: rgba(15, 155, 142, 0.015);
}

.ic-icon {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(15, 155, 142, 0.06);
  border: 1px solid rgba(15, 155, 142, 0.06);
  display: flex; align-items: center; justify-content: center;
  color: rgba(15, 155, 142, 0.5);
}
.ic-body {
  flex: 1; min-width: 0;
}
.ic-label {
  font-size: 10px; font-weight: 600;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 6px;
}
.ic-value {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.65);
  margin: 0;
  line-height: 1.5;
}
.signature-text {
  font-style: italic;
  color: rgba(15, 155, 142, 0.7);
  font-size: 1rem;
}
.bv-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: rgba(230, 168, 23, 0.7);
}

/* --- Empty state --- */
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  animation: fadeUp 0.6s ease 0.15s backwards;
}
.empty-icon-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.08);
  margin-bottom: 20px;
}
.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  margin: 0 0 6px;
}
.empty-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.2);
  margin: 0 0 24px;
}
.empty-cta {
  background: none;
  border: 1px solid rgba(15,155,142,0.15);
  color: #0f9b8e;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.empty-cta:hover {
  background: rgba(15,155,142,0.08);
  border-color: rgba(15,155,142,0.3);
  transform: translateX(4px);
}

/* --- Remark --- */
.remark-section {
  margin-top: 20px;
  animation: fadeUp 0.6s ease 0.25s backwards;
}
.remark-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(to right, rgba(255,255,255,0.08), transparent);
  margin-bottom: 12px;
}
.remark-text {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.2);
  margin: 0;
  font-style: italic;
}

/* --- Responsive --- */
@media (max-width: 600px) {
  .page-nav { padding: 12px 16px; }
  .page-content { padding: 80px 16px 40px; }
  .hero-avatar { width: 80px; height: 80px; }
  .hero-avatar-text span { font-size: 2rem; }
  .hero-name { font-size: 1.3rem; }
}
</style>
