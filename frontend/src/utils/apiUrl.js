// Centralized API URL builder.
//
// Goals:
// - DEV: default to same-origin (""), so Vite proxy rules keep working unchanged.
// - PROD: default to the public domain so requests hit reverse proxy rules.
//   (Can be overridden by VITE_API_BASE_URL.)

const PROD_DEFAULT_API_BASE = 'http://7thcv.cn'

const trimTrailingSlash = (url) => (url || '').replace(/\/+$/, '')

export const getApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()

  if (import.meta.env.DEV) {
    // Keep dev behavior: prefer Vite proxy with relative paths.
    return configured ? trimTrailingSlash(configured) : ''
  }

  return trimTrailingSlash(configured || PROD_DEFAULT_API_BASE)
}

export const apiUrl = (path) => {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
