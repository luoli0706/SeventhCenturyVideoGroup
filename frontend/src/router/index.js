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

const routes = [
  { path: '/', component: LoginChoice },
  { path: '/home', component: Home },
  { path: '/member-login', component: MemberLogin },
  { path: '/register', component: NewRegister },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/change-password', component: ChangePassword },
  { path: '/admin-login', component: AdminLogin },
  { path: '/memory-code-view', component: MemoryCodeView },
  
  // 公开路由
  { path: '/members', component: Members },
  { path: '/members/all-years', component: AllYears },
  { path: '/members/current', component: Current },
  { path: '/members/active-by-year', component: ActiveByYear },
  { path: '/events', component: Events },
  { path: '/animation', component: Animation },
  { path: '/static', component: Static },
  { path: '/3d', component: ThreeD },
  { path: '/recruit', component: Recruit },
  { path: '/member/:name', component: MemberProfile },
  { path: '/ai-assistant', component: AIAssistant },
  
  // 需要成员权限的路由
  { 
    path: '/events/upload', 
    component: UploadEvent,
    beforeEnter: requireMember
  },
  { 
    path: '/member/:name/edit', 
    component: EditMemberProfile,
    beforeEnter: requireMemberOwner
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router