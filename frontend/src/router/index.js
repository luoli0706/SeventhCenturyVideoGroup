import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Members from '../views/Members.vue'
import AllYears from '../views/members/AllYears.vue'
import ActiveByYear from '../views/members/ActiveByYear.vue'
import Current from '../views/members/Current.vue'
import Register from '../views/Register.vue' // 新增

const routes = [
  { path: '/', component: Home },
  {
    path: '/members',
    component: Members,
    children: [
      { path: 'all-years', component: AllYears },
      { path: 'active-by-year', component: ActiveByYear },
      { path: 'current', component: Current },
      // 下面可继续添加各级/各年具体名单页面
    ]
  },
  { path: '/register', component: Register }, // 新增登记信息页面路由
  // 其他路由...
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router