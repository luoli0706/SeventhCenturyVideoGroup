export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  devServer: { port: 3000 },
  app: {
    head: {
      title: '柒世纪视频组',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '柒世纪视频组 — MAD·MMD 创作研究社团' }
      ]
    }
  },
  css: ['@/assets/main.css'],
  nitro: {
    preset: 'node-server',
    rollupConfig: {
      external: ['@alicloud/captcha20230305', '@alicloud/openapi-core'],
    },
  },
  runtimeConfig: {
    aliyunCaptcha: {
      accessKeyId: '',
      accessKeySecret: '',
    },
    public: {
      aliyunCaptchaSceneId: '',
      aliyunCaptchaPrefix: '',
    }
  },
  compatibilityDate: '2026-05-31'
})
