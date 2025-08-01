import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Members from '../views/Members.vue'
import AllYears from '../views/members/AllYears.vue'
import ActiveByYear from '../views/members/ActiveByYear.vue'
import Current from '../views/members/Current.vue'
import Register from '../views/Register.vue'
import Events from '../views/Events.vue'
import UploadEvent from '../views/UploadEvent.vue'
import Animation from '../views/Animation.vue'
import Static from '../views/Static.vue'
import ThreeD from '../views/ThreeD.vue'
import Recruit from '../views/Recruit.vue'
import MemberProfile from '../views/MemberProfile.vue'
import EditMemberProfile from '../views/EditMemberProfile.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/members', component: Members },
  { path: '/members/all-years', component: AllYears },
  { path: '/members/current', component: Current },
  { path: '/members/active-by-year', component: ActiveByYear },
  { path: '/register', component: Register },
  { path: '/recruit', component: Recruit },
  { path: '/events', component: Events },
  { path: '/events/upload', component: UploadEvent },
  { path: '/animation', component: Animation },
  { path: '/static', component: Static },
  { path: '/3d', component: ThreeD },
  { path: '/member/:name', component: MemberProfile },
  { path: '/member/:name/edit', component: EditMemberProfile },
  // 可继续添加活动详情页路由
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router