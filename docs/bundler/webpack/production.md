# Webpack 生产构建常用知识点

Webpack 的核心优势不是“更老”，而是“更完整、更可定制”。在复杂构建链路、历史项目、兼容性要求高的场景里，它仍然很常见。

## 1. 一个常见的生产配置骨架

```js
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/app/',
    filename: 'assets/js/[name].[contenthash:8].js',
    chunkFilename: 'assets/js/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
    clean: true
  },
  cache: {
    type: 'filesystem'
  },
  devtool: 'hidden-source-map',
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|vue|vue-router)[\\/]/,
          name: 'framework',
          priority: 30
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        }
      }
    },
    minimizer: ['...', new CssMinimizerPlugin()]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].[contenthash:8].css'
    })
  ]
}
```

这个骨架里最关键的不是插件名字，而是这些生产原则：

- 文件名带 hash，支持长期缓存
- runtime 单独拆分，降低无关变更导致的缓存失效
- chunk id / module id 稳定化
- CSS 独立提取并压缩
- source map 单独用于线上排障

## 2. `splitChunks` 才是 Webpack 生产优化主战场之一

### 推荐目标

- 首页只拿到当前页面需要的代码
- 核心框架单独缓存
- 重依赖按业务边界拆开
- 避免生成一个超级大的 `vendor`

### 常见拆法

- `framework`：React/Vue 等框架层
- `vendor`：通用三方依赖
- `editor` / `chart` / `pdf`：重依赖单独拆分
- route chunk：业务页面按需加载

### 常见误区

- cacheGroups 写得很花，但首页实际上没变小
- 为了“美观”强行拆很多 chunk，反而导致请求过碎
- 只看压缩后总体积，不看首屏关键路径

## 3. `runtimeChunk` 很重要

如果不拆 runtime，Webpack 运行时代码经常混在业务 chunk 里。这样一个小改动也可能让原本稳定缓存的 chunk 文件名变化。

常见配置：

```js
optimization: {
  runtimeChunk: 'single'
}
```

这样做的价值：

- runtime 变化和业务 chunk 变化解耦
- 更利于长期缓存
- 更新命中更精确

## 4. `contenthash`、稳定 id 和长期缓存

只写 `[contenthash]` 还不够，通常还要配合：

- `moduleIds: 'deterministic'`
- `chunkIds: 'deterministic'`
- `runtimeChunk: 'single'`

否则很容易出现：

- 业务代码只改了一点
- 但 vendor chunk 也换 hash
- 用户缓存命中率下降

这也是为什么生产缓存不是“文件名带 hash”一句话就能解决。

## 5. CSS 在 Webpack 里通常要独立提取

开发环境常见 `style-loader`，但生产环境更常见：

- `MiniCssExtractPlugin`
- `CssMinimizerPlugin`

原因很直接：

- CSS 独立文件更利于缓存
- 不要把大量样式都塞进 JS
- 浏览器可以并行下载和缓存 CSS

需要注意：

- 拆分后的 CSS 顺序问题
- 公共样式重复注入问题
- 大型项目全局样式膨胀问题

## 6. `devtool` 要服务线上排障

生产里常见：

- `source-map`：会暴露引用
- `hidden-source-map`：更适合上传给监控平台
- `false`：最保守，但排障很差

如果团队接了 Sentry、Fundebug 一类平台，`hidden-source-map` 往往更稳妥。

## 7. Tree-shaking 在 Webpack 里的前提

常见相关项：

- `usedExports`
- `sideEffects`
- 生产模式压缩

但想真正摇掉代码，还是得满足：

- 模块是 ESM
- 导入方式可静态分析
- 依赖包没有乱写副作用

Tree-shaking 不生效时，不要只盯 Webpack 配置，很多时候是依赖格式本身有问题。

## 8. Webpack 构建速度优化常见手段

### 开发阶段

- `cache: { type: 'filesystem' }`
- Babel `cacheDirectory`
- 减少 loader 链路
- 大项目按目录收敛编译范围

### 生产 / CI 阶段

- 缓存包管理器依赖
- 缓存 Webpack 构建缓存
- 类型检查和打包分阶段
- 用 analyzer 定期治理体积，而不是等到包炸了再救火

### 关于并行

`thread-loader` 不是无脑收益。模块数量少或机器核数有限时，线程通信成本可能抵掉收益。

## 9. `externals` 和 CDN 不是银弹

适合场景：

- 极稳定的公共依赖
- 对外网依赖可接受
- 有统一资源注入和兜底策略

风险：

- 版本和运行时代码失配
- 内网、弱网、离线环境不可用
- HTML 模板和资源注入更复杂

多数中后台项目里，优先做稳定拆包和缓存，通常比盲目外链更稳。

## 10. Webpack 线上高频问题

| 现象 | 常见原因 |
| --- | --- |
| 发布后旧页面白屏 | 旧 chunk 被清理，异步加载 404 |
| vendor 经常变 hash | runtime 没拆、id 不稳定、公共依赖耦合太重 |
| 包体积大 | 首页引了重依赖、CJS 无法摇树、重复依赖 |
| 样式异常 | CSS 抽离后顺序变化或公共样式管理混乱 |
| 排障困难 | 没有 source map 或版本映射混乱 |

## 11. 什么时候更适合继续用 Webpack

这些情况 Webpack 往往更合理：

- 存量大型项目，构建链路复杂
- 需要深度定制 loader / plugin
- 强依赖成熟微前端能力
- 兼容性要求复杂
- 团队已有稳定的 Webpack 工程体系

如果项目本身已经稳定，单纯为了“流行”迁移到 Vite，不一定有生产收益。
