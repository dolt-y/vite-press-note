# Vite 生产构建常用知识点

Vite 的开发体验很强，但生产构建并不是“自动最优”。真正上线时，还是要回到 chunk、缓存、兼容性和部署一致性这些问题。

## 1. 先记住两个关键事实

### 开发快，不等于生产天然更优

Vite 开发阶段基于原生 ESM，冷启动和 HMR 很快；但生产阶段仍然要做正式打包，核心能力来自 Rollup。

### `optimizeDeps` 主要服务开发阶段

很多人误以为 `optimizeDeps` 是生产优化开关。不是。它主要用于开发时依赖预构建，减少 dev server 冷启动和 CJS 转换成本。

## 2. 生产环境常用配置骨架

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/app/' : '/',
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'es2018',
    sourcemap: 'hidden',
    manifest: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          framework: ['vue', 'vue-router'],
          chart: ['echarts'],
          editor: ['monaco-editor']
        }
      }
    }
  }
}))
```

这个配置真正解决的问题：

- `base`：解决部署目录和静态资源前缀问题
- `manifest`：给服务端模板、SSR、部署平台做资源映射
- `sourcemap: 'hidden'`：方便监控排障，不直接暴露源码映射
- `manualChunks`：把重依赖从首屏中拆出去
- hash 文件名：支持长期缓存

## 3. Vite 生产构建最常用的知识点

### 3.1 `base`

这是线上最容易配错的项之一。

- 部署在根路径：通常用 `/`
- 部署在子路径：例如 `/app/`
- 部署到 CDN 子目录：要保证最终资源 URL 可访问

如果 `base` 错了，最常见症状是：

- 本地正常，线上静态资源 404
- 路由切换后异步 chunk 加载失败
- CSS / 字体路径异常

### 3.2 `manifest`

适合这些场景：

- 服务端模板需要知道当前版本 JS / CSS 文件名
- SSR 需要把构建产物和页面模板做映射
- 部署系统要区分入口文件和异步资源

生产里不要依赖手写固定文件名，因为带 hash 的资源名才适合长期缓存。

### 3.3 `manualChunks`

Vite 默认能做一定拆分，但对重依赖和业务边界，通常还是要手工控制。

适合单独拆出的依赖：

- 图表库
- 编辑器
- PDF 相关库
- 地图 SDK
- 低频页面独占的大模块

不建议的拆法：

- 所有 `node_modules` 都硬拆成一个大 `vendor`
- 每个三方包都拆一个 chunk，导致请求碎片化

### 3.4 `cssCodeSplit`

默认开启通常更合理，因为：

- CSS 可以跟随页面和 chunk 按需加载
- 静态资源缓存粒度更细

但也要注意：

- 拆分后样式顺序问题更容易暴露
- 公共样式过多时，多个页面可能重复下载

### 3.5 `sourcemap`

生产常用值：

- `false`：最省事，但排障能力差
- `true`：会公开 source map 文件
- `'hidden'`：常见生产方案，生成 map 但不在产物里追加引用注释

大多数团队更偏向 `'hidden'` + 错误监控平台上传。

### 3.6 `assetsInlineLimit`

控制小资源是否转成 base64 内联。

原则：

- 很小的图标可以内联，减少请求
- 较大的图片、字体不要内联，否则主包体积膨胀

这不是越大越好。移动端项目把大量资源内联，通常得不偿失。

### 3.7 `target` 和兼容性

Vite 默认偏现代浏览器。如果你的运行环境包含：

- 企业内网老浏览器
- 老 Android WebView
- 嵌入式 WebView

就要明确配置 `target`，并评估是否需要 `@vitejs/plugin-legacy`。

## 4. Vite 里几个容易误解的点

### 4.1 `optimizeDeps` 不是生产优化主战场

它主要改善：

- dev server 冷启动
- 开发时 CJS 转 ESM 的成本

它不能替代生产拆包、缓存和发布策略。

### 4.2 `define` 只是字符串替换

不要把它理解成运行时配置中心。构建后这些值会写进产物。

### 4.3 动态导入写法会影响拆包

推荐：

```ts
const Page = () => import('./pages/report')
```

谨慎使用过度动态的路径拼接，否则构建工具难以静态分析，拆包和预加载都可能变差。

## 5. Worker 在 Vite 里的常见写法

### 独立 worker 文件

```ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module'
})
```

适合：

- 体积较大的 worker
- 需要缓存
- 多页面复用

### 内联 worker

适合非常小的 worker。否则会把主包一起带大。

## 6. Vite 生产排障高频问题

| 现象 | 常见原因 |
| --- | --- |
| 线上资源 404 | `base` 配错、CDN 路径不一致 |
| 首屏包过大 | 重依赖没拆、首页误引低频模块 |
| 包分析看起来正常，但线上还是慢 | 请求数过多、弱网下 chunk 过碎 |
| 线上错误栈无法还原 | 没生成或没上传 source map |
| 老浏览器直接白屏 | target 过新、缺少 legacy/polyfill |

## 7. 一份更贴近生产的 Vite 思路

可以把 Vite 生产优化归纳成一句话：

先用它的默认能力拿到不错的基线，再手动补上缓存策略、chunk 规划、source map、兼容性和发布一致性。

真正决定线上质量的，通常不是 Vite 本身，而是你有没有把这些配套环节补齐。
