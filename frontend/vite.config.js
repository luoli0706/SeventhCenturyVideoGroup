import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 代理n8n API请求（优先匹配，更具体的路径）
      '/api/n8n': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('n8n proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to n8n:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from n8n:', proxyRes.statusCode, req.url);
          });
        }
      },
      // 代理Cloudflare验证服务（优先匹配，更具体的路径）
      '/api/cf-verify': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cf-verify/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('cf-verify proxy error', err);
          });
        }
      },
      // 代理后端Go API请求（通用匹配，放在最后）
      '/api': {
        target: 'http://localhost:7777',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('backend API proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from Backend:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
