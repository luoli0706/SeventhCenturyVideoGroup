import axios from 'axios'

const api = axios.create({
  baseURL: 'https://7thcv.cn'
})

// 自动附加认证token到所有请求
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
