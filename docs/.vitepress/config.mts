import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'note',
  description: 'A VitePress Site',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '基础', link: '/base/info' },
      { text: 'Bundler', link: '/bundler' },
    ],
    sidebar: {
      '/': [
        {
          text: '文档',
          items: [
            { text: '基础总览', link: '/base/info' },
            { text: 'Bundler', link: '/bundler' },
          ],
        },
      ],
      '/base/': [
        {
          text: '基础',
          items: [
            { text: '总览', link: '/base/info' },
            {
              text: 'CSS',
              items: [
                { text: 'CSS 基础', link: '/base/css/css' },
                { text: '选择器', link: '/base/css/选择器' },
              ],
            },
            {
              text: 'HTML',
              items: [
                { text: 'HTML', link: '/base/html/html' },
                { text: 'HTML5', link: '/base/html/html5' },
                { text: 'Head', link: '/base/html/head' },
                { text: 'Flex', link: '/base/html/flex' },
              ],
            },
            {
              text: 'JavaScript',
              items: [
                { text: 'ES6', link: '/base/javascript/es6' },
                { text: '闭包', link: '/base/javascript/闭包' },
                { text: '速查表', link: '/base/javascript/速查表' },
                {
                  text: '异步',
                  items: [
                    { text: 'Node 事件循环', link: '/base/javascript/异步/Node事件循环' },
                    { text: '浏览器事件循环', link: '/base/javascript/异步/浏览器事件循环' },
                  ],
                },
              ],
            },
          ],
        },
      ],
      '/bundler/': [
        {
          text: 'Bundler',
          items: [
            { text: '总览', link: '/bundler' },
            { text: '生产环境构建实践清单', link: '/bundler/study' },
            {
              text: 'Vite',
              items: [
                { text: '生产构建常用知识点', link: '/bundler/vite/production' },
              ],
            },
            {
              text: 'Webpack',
              items: [
                { text: '生产构建常用知识点', link: '/bundler/webpack/production' },
                { text: '[chunkhash] 详解', link: '/bundler/webpack/chunkhash' },
              ],
            },
          ],
        },
      ],
    },
    docFooter: {
      prev: '上一节',
      next: '下一节',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © 2026-${new Date().getFullYear()} Wen.Yao`,
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/dolt-y' }],
  },
  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
    },
  },
});
