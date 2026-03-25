# 前端构建工具：Vite 与 Webpack 的生产视角

前端构建工具不是“把代码打成一个包”这么简单。到了生产环境，真正关心的是：

- 首屏和交互性能是否稳定
- 资源能不能长期缓存
- 构建产物能不能灰度、回滚、排障
- 依赖升级后，构建链路是否可控

## 1. Vite 和 Webpack 的核心差异

| 维度 | Webpack | Vite |
| --- | --- | --- |
| 开发阶段 | 先构建模块图，再启动 dev server | 基于原生 ESM 按需启动，冷启动更快 |
| 生产构建 | Webpack 自己完成打包 | 生产阶段本质上仍然交给 Rollup |
| 核心扩展点 | loader + plugin | Vite plugin，底层可复用 Rollup 插件 |
| 大型老项目兼容 | 更成熟，历史包袱和生态都更完整 | 更适合现代项目，迁移旧链路要评估插件兼容 |
| 微前端 / Module Federation | 更成熟 | 有社区方案，但成熟度和兼容性通常不如 Webpack |
| 构建性能调优 | 可调项很多，但配置复杂 | 默认体验更好，深度定制时仍要理解 Rollup |
| 适用场景 | 大型存量项目、复杂构建链路、强定制场景 | 新项目、中后台、组件站点、现代框架应用 |

结论不是“Vite 完全替代 Webpack”，而是：

- 开发体验：多数现代项目优先 Vite
- 构建链路复杂度高、历史项目重：Webpack 仍然很常见
- 线上性能优化思路：两者大部分是相通的

## 2. 生产环境真正要掌握的知识点

下面这些点，才是实际工作里最常出现的内容：

| 主题 | 为什么重要 | Vite 常见入口 | Webpack 常见入口 |
| --- | --- | --- | --- |
| 长期缓存 | 避免每次发布都让用户全量下载 | `build.rollupOptions.output`、`manifest` | `output.filename`、`contenthash`、`runtimeChunk` |
| 代码分割 | 控制首屏体积，延迟加载大依赖 | `manualChunks`、动态 `import()` | `splitChunks`、动态 `import()` |
| Source Map 策略 | 线上报错定位需要，源码又不能随便暴露 | `build.sourcemap: 'hidden'` | `devtool: 'hidden-source-map'` |
| 环境变量 | 区分 dev / test / staging / prod | `import.meta.env`、`envPrefix` | `DefinePlugin`、`EnvironmentPlugin` |
| 兼容性和 Polyfill | 老浏览器/低版本 WebView 会直接出问题 | `@vitejs/plugin-legacy` | Babel + `browserslist` |
| Tree-shaking | 减少无效代码进入产物 | ESM + `sideEffects` | ESM + `sideEffects` + `usedExports` |
| CSS 策略 | 防止大 CSS 阻塞首屏，解决样式拆分与缓存 | `cssCodeSplit` | `MiniCssExtractPlugin` |
| 静态资源处理 | 图片/字体/Worker/WASM 体积和缓存策略不同 | `assetsInlineLimit`、worker query | asset modules、loader |
| 构建分析 | 为什么包变大、为什么重复打包 | visualizer | `webpack-bundle-analyzer` |
| 发布与回滚 | 避免 `ChunkLoadError`、资源 404、灰度错配 | manifest + 保留旧资源 | manifest/runtime 分离 + 保留旧资源 |

## 3. 一条完整的生产构建链路

可以把生产构建理解成下面这条流水线：

1. 源码编译：TS/JSX/SFC 转成浏览器能识别的 JS/CSS。
2. 依赖解析：把 `import` 关系整理成模块图。
3. 代码分割：把首屏、路由、重依赖拆成不同 chunk。
4. 压缩优化：删除死代码、压缩 JS/CSS、处理图片和字体。
5. 哈希命名：输出带 hash 的静态资源，支持长期缓存。
6. 产物映射：生成 manifest，给服务端或部署系统做资源映射。
7. 上传发布：静态资源推到 CDN，对 HTML 做短缓存或不缓存。
8. 监控排障：上传 source map，接入错误监控和包体积分析。

很多项目的问题，不是“不会配插件”，而是只盯着第 1 步和第 4 步，忽略了缓存、发布一致性和回滚策略。

## 4. 生产环境里的高频实践

### 4.1 长期缓存

- JS / CSS / 图片文件名带 hash，例如 `[contenthash]` 或 `[hash]`
- HTML 不做长缓存，静态资源做长缓存
- 拆分 runtime，避免一个小改动让整批 chunk hash 一起变化
- 发布时不要立即删除旧资源，否则旧页面会出现 `ChunkLoadError`

### 4.2 代码分割

- 路由级拆分：页面级资源按需加载
- 大依赖拆分：例如图表库、编辑器、PDF、地图 SDK
- 按变更频率拆分 vendor：`react`、`echarts`、编辑器不要全塞进一个大 vendor
- 不要过度拆包，否则请求数和调度开销会上升

### 4.3 Source Map

- 本地调试可直接开
- 生产环境一般用 hidden source map，然后上传到 Sentry 一类平台
- 不建议默认把完整 source map 公开暴露在 CDN

### 4.4 环境变量

- 前端环境变量本质是构建时替换，不是运行时真正保密
- API 密钥、数据库密码、私有 Token 不能直接注入前端
- `base/publicPath` 必须和实际部署路径一致，否则静态资源会 404

### 4.5 兼容性

- Vite 快，不代表天然兼容旧浏览器
- 旧 WebView、企业内网环境往往还需要 Babel / legacy 插件
- 是否支持 `dynamic import`、`Promise`、`URL` 等能力，要跟目标运行环境核对

### 4.6 构建分析

- 看体积不要只看总大小，还要看首屏关键路径
- 看 gzip/brotli 后大小，也要看 chunk 数量
- 重复依赖、错误拆包、公共模块回收失败，通常比“压缩器选谁”更影响结果

## 5. Vite 和 Webpack 的认知误区

### 误区 1：Vite 生产构建天然更优

不是。Vite 的优势主要在开发阶段，生产产物是否优，需要看 chunk 策略、依赖结构、缓存策略和资源部署方式。

### 误区 2：只要上 CDN 就够了

不是。CDN 只是分发层，前提是：

- 文件名可缓存
- HTML 更新和静态资源版本匹配
- 旧版本资源保留足够时间

### 误区 3：拆包越细越好

不是。拆包的目标是减少关键路径体积，不是制造大量小文件。很多移动端弱网环境下，小 chunk 过多反而更慢。

### 误区 4：线上 source map 一定不能开

也不对。正确做法通常是“生成但不公开”，只给监控平台或内部排障系统使用。

## 6. 学习顺序建议

按生产价值排序，建议优先掌握：

1. 资源 hash 与缓存策略
2. 路由拆包和 vendor 拆包
3. source map 与错误监控
4. 环境变量与部署路径
5. 包体积分析和重复依赖治理
6. 兼容性、polyfill、legacy 支持
7. Worker / WASM / 外链资源等特殊资产

## 7. 这部分笔记的知识树

```text
Bundler
├── 基础认知
│   ├── 模块图
│   ├── loader / plugin
│   ├── dev server / HMR
│   └── build pipeline
├── 生产优化
│   ├── 长期缓存
│   ├── 代码分割
│   ├── Tree-shaking
│   ├── CSS 拆分
│   ├── Source Map
│   ├── 兼容性与 polyfill
│   └── 包体积分析
├── 发布体系
│   ├── 环境变量
│   ├── publicPath / base
│   ├── manifest
│   ├── CDN
│   └── 回滚策略
├── 特殊资源
│   ├── 图片 / 字体
│   ├── Worker
│   ├── WASM
│   └── 第三方 SDK
├── Vite
│   ├── optimizeDeps
│   ├── manualChunks
│   ├── legacy
│   └── Rollup output
└── Webpack
    ├── splitChunks
    ├── runtimeChunk
    ├── contenthash
    └── filesystem cache
```

## 8. 对应实战笔记

- `study.md`：生产环境构建清单
- `vite/production.md`：Vite 生产构建常用知识点
- `webpack/production.md`：Webpack 生产构建常用知识点
- `webpack/chunkhash.md`：hash / chunkhash / contenthash 的缓存专题
