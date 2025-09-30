import { createRouter, createWebHistory } from 'vue-router'
import { requireMember, requireMemberOwner } from '../utils/auth'

import Home from '../views/Home.vue'
import Members from '../views/Members.vue'
import AllYears from '../views/members/AllYears.vue'
import ActiveByYear from '../views/members/ActiveByYear.vue'
import Current from '../views/members/Current.vue'
import Events from '../views/Events.vue'
import UploadEvent from '../views/UploadEvent.vue'
import Animation from '../views/Animation.vue'
import Static from '../views/Static.vue'
import ThreeD from '../views/ThreeD.vue'
import Recruit from '../views/Recruit.vue'
import MemberProfile from '../views/MemberProfile.vue'
import EditMemberProfile from '../views/EditMemberProfile.vue'

// 新增认证相关页面
import LoginChoice from '../views/LoginChoice.vue'
import MemberLogin from '../views/MemberLogin.vue'
import NewRegister from '../views/NewRegister.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ChangePassword from '../views/ChangePassword.vue'
import AdminLogin from '../views/AdminLogin.vue'
import MemoryCodeView from '../views/MemoryCodeView.vue'
import AIAssistant from '../views/AIAssistant.vue'
import VerifyPage from '../views/VerifyPage.vue'

// Cloudflare验证守卫
const requireVerification = (to, from, next) => {
  // 开发环境跳过验证
  if (import.meta.env.DEV) {
    next()
    return
  }

  // 检查验证状态
  const verifyToken = localStorage.getItem('cf_verify_token')
  const verifyExpires = localStorage.getItem('cf_verify_expires')
  
  if (verifyToken && verifyExpires && Date.now() < parseInt(verifyExpires)) {
    // 验证有效
    next()
  } else {
    // 需要验证
    localStorage.removeItem('cf_verify_token')
    localStorage.removeItem('cf_verify_expires')
    next('/verify')
  }
}

const routes = [
  // 验证页面 (无需守卫)
  { path: '/verify', component: VerifyPage },
  
  // 登录相关页面 (需要验证)
  { path: '/', component: LoginChoice, beforeEnter: requireVerification },
  { path: '/member-login', component: MemberLogin, beforeEnter: requireVerification },
  { path: '/register', component: NewRegister, beforeEnter: requireVerification },
  { path: '/forgot-password', component: ForgotPassword, beforeEnter: requireVerification },
  { path: '/change-password', component: ChangePassword, beforeEnter: requireVerification },
  { path: '/admin-login', component: AdminLogin, beforeEnter: requireVerification },
  { path: '/memory-code-view', component: MemoryCodeView, beforeEnter: requireVerification },
  
  // 主要页面 (需要验证)
  { path: '/home', component: Home, beforeEnter: requireVerification },
  { path: '/members', component: Members, beforeEnter: requireVerification },
  { path: '/members/all-years', component: AllYears, beforeEnter: requireVerification },
  { path: '/members/current', component: Current, beforeEnter: requireVerification },
  { path: '/members/active-by-year', component: ActiveByYear, beforeEnter: requireVerification },
  { path: '/events', component: Events, beforeEnter: requireVerification },
  { path: '/animation', component: Animation, beforeEnter: requireVerification },
  { path: '/static', component: Static, beforeEnter: requireVerification },
  { path: '/3d', component: ThreeD, beforeEnter: requireVerification },
  { path: '/recruit', component: Recruit, beforeEnter: requireVerification },
  { path: '/member/:name', component: MemberProfile, beforeEnter: requireVerification },
  { path: '/ai-assistant', component: AIAssistant, beforeEnter: requireVerification },
  
  // 需要成员权限的路由 (验证 + 成员权限)
  { 
    path: '/events/upload', 
    component: UploadEvent,
    beforeEnter: [requireVerification, requireMember]
  },
  { 
    path: '/member/:name/edit', 
    component: EditMemberProfile,
    beforeEnter: [requireVerification, requireMemberOwner]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router