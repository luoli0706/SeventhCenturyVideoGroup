// 认证相关工具函数
export const auth = {
  // 获取token
  getToken() {
    return localStorage.getItem('token')
  },
  
  // 获取用户信息
  getUserInfo() {
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  },
  
  // 检查是否已登录
  isLoggedIn() {
    return !!this.getToken()
  },
  
  // 检查是否为社团成员
  isMember() {
    const userInfo = this.getUserInfo()
    return userInfo && userInfo.is_member
  },
  
  // 获取用户类型
  getUserType() {
    return localStorage.getItem('userType')
  },
  
  // 登出
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userType')
  },
  
  // 设置axios默认header
  setAuthHeader(axios) {
    const token = this.getToken()
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
}

// 路由守卫 - 检查成员权限
export const requireMember = (to, from, next) => {
  const userType = auth.getUserType()
  
  if (userType !== 'member') {
    alert('访客无法访问该功能')
    next('/home')
    return
  }
  
  if (!auth.isMember()) {
    alert('访客无法访问该功能')
    next('/home')
    return
  }
  
  next()
}

// 路由守卫 - 检查成员权限且CN匹配
export const requireMemberOwner = (to, from, next) => {
  const userType = auth.getUserType()
  
  if (userType !== 'member') {
    alert('访客无法访问该功能')
    next('/home')
    return
  }
  
  if (!auth.isMember()) {
    alert('访客无法访问该功能')
    next('/home')
    return
  }
  
  const currentUser = auth.getUserInfo()
  const targetCN = decodeURIComponent(to.params.name)
  
  if (!currentUser || !currentUser.cn) {
    alert('获取用户信息失败，请重新登录')
    next('/home')
    return
  }
  
  if (currentUser.cn !== targetCN) {
    alert('您无权修改该主页')
    next('/home')
    return
  }
  
  next()
}

// 路由守卫 - 检查是否已登录
export const requireAuth = (to, from, next) => {
  if (!auth.isLoggedIn()) {
    next('/')
    return
  }
  
  next()
}
