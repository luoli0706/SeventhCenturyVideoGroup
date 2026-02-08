import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 代理Python RAG后端 (LangChain)
      '/api/rag': {
        target: 'http://localhost:6201',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Python RAG proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to Python RAG:', req.method, req.url);
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
