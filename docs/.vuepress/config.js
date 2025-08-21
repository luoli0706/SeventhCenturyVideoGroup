import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'SVCG 开发者文档',
  description: '柒世纪视频组社团管理系统开发者文档',
  
  bundler: viteBundler(),
  
  head: [
    ['link', { rel: 'icon', href: '/images/logo.png' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
  ],

  theme: defaultTheme({
    logo: '/images/logo.png',
    repo: 'luoli0706/SeventhCenturyVideoGroup',
    docsDir: 'docs',
    docsBranch: 'main',
    editLink: true,
    editLinkText: '在 GitHub 上编辑此页',
    lastUpdated: true,
    lastUpdatedText: '上次更新',
    contributors: true,
    contributorsText: '贡献者',

    navbar: [
      {
        text: '首页',
        link: '/',
      },
      {
        text: '快速开始',
        link: '/guide/',
      },
      {
        text: '开发指南',
        children: [
          {
            text: '前端开发',
            link: '/development/frontend/',
          },
          {
            text: '后端开发',
            link: '/development/backend/',
          },
          {
            text: 'API 文档',
            link: '/api/',
          },
        ],
      },
      {
        text: '部署运维',
        link: '/deployment/',
      },
      {
        text: '更新日志',
        link: '/changelog/',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '快速开始',
          children: [
            '/guide/README.md',
            '/guide/installation.md',
            '/guide/configuration.md',
            '/guide/getting-started.md',
          ],
        },
      ],
      '/development/': [
        {
          text: '开发指南',
          children: [
            '/development/README.md',
            '/development/frontend/',
            '/development/backend/',
            '/development/database.md',
            '/development/testing.md',
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          children: [
            '/api/README.md',
            '/api/auth.md',
            '/api/members.md',
            '/api/activities.md',
            '/api/profiles.md',
          ],
        },
      ],
      '/deployment/': [
        {
          text: '部署运维',
          children: [
            '/deployment/README.md',
            '/deployment/docker.md',
            '/deployment/production.md',
            '/deployment/monitoring.md',
          ],
        },
      ],
    },
  }),
})
