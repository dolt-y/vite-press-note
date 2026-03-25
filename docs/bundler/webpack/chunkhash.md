# Webpack `[chunkhash]` 详解

## 1. `[chunkhash]` 是什么

`[chunkhash]` 是 Webpack 输出文件名里常见的占位符，用来根据 chunk 内容生成 hash。

可以先把它理解成：

- 一个 chunk 对应一个 hash
- chunk 内容不变，hash 通常不变
- chunk 内容变了，hash 就会变

它的核心目的不是“看起来高级”，而是为了浏览器长期缓存。

## 2. 为什么它对生产环境很重要

如果你的文件名一直是固定的，例如 `app.js`：

- 浏览器可能长期命中旧缓存
- 服务器发布了新版本，用户却还在跑旧代码
- 结果就是资源错配、页面异常、缓存失效难控制

带上 `[chunkhash]` 后，文件名会变成类似：

- `app.a1b2c3d4.js`
- `vendor.e5f6g7h8.js`

这样浏览器就能根据“文件名是否变化”判断要不要重新下载。

## 3. 工作原理

### 内容不变

如果一个 chunk 的内容没有变化，那么它生成的 hash 也通常保持不变。

结果是：

- 文件名不变
- 浏览器继续使用已有缓存
- 用户不需要重复下载

### 内容变化

如果 chunk 内容变化了，Webpack 会生成新的 hash。

结果是：

- 文件名变化
- 浏览器把它视为一个新资源
- 用户会下载新版本文件

这就是构建工具和浏览器缓存配合的基础机制。

## 4. `[hash]`、`[chunkhash]`、`[contenthash]` 的区别

### `[hash]`

代表整次构建的 hash。

特点：

- 任意一个文件变化，整个构建 hash 都可能变化
- 容易导致本来没变的资源也跟着换文件名

所以它不适合长期缓存的主场景。

### `[chunkhash]`

代表每个 chunk 的 hash。

特点：

- 只在当前 chunk 内容变化时才变化
- 比 `[hash]` 更适合 JS chunk 的缓存控制

### `[contenthash]`

代表输出文件内容的 hash。

它常见于：

- CSS 文件
- Webpack 5 中的 JS 输出文件

生产里你会经常看到它和 `[chunkhash]` 一起被讨论，因为两者都服务于长期缓存。

## 5. 一个最直观的理解方式

假设你有两个 chunk：

- `app`
- `vendor`

如果这次只改了业务代码：

- `app` 的 hash 变化
- `vendor` 的 hash 应尽量保持不变

这样用户只需要重新下载 `app`，不用把稳定的三方依赖也重新下载一遍。

这就是长期缓存的理想状态。

## 6. 配置示例

```js
output: {
  filename: 'js/[name].[chunkhash:8].js',
  chunkFilename: 'js/[name].[chunkhash:8].js'
}
```

含义：

- 入口 chunk 使用 `[chunkhash]`
- 异步 chunk 也使用 `[chunkhash]`
- 文件名会随 chunk 内容变化而变化

如果 CSS 独立提取，通常会配合：

```js
new MiniCssExtractPlugin({
  filename: 'css/[name].[contenthash:8].css'
})
```

## 7. 只用 `[chunkhash]` 还不够

这是生产里最容易忽略的点。

如果你只是写了 `[chunkhash]`，但没有处理下面这些问题，缓存效果仍然可能不稳定：

- runtime 没拆分
- module id / chunk id 不稳定
- `splitChunks` 拆包策略不合理
- vendor 和业务代码耦合过重

也就是说，`[chunkhash]` 是长期缓存的基础，但不是全部。

## 8. 为什么很多项目还要配 `runtimeChunk`

Webpack 有一部分运行时代码负责模块加载和 chunk 映射。

如果 runtime 混在业务 chunk 里，经常会导致：

- 改一点业务代码
- runtime 一起变
- 多个 chunk 跟着换 hash

常见配置：

```js
optimization: {
  runtimeChunk: 'single'
}
```

这样可以把运行时代码单独拆出去，减少无意义的缓存失效。

## 9. 为什么还要配稳定 id

生产里还常见：

```js
optimization: {
  moduleIds: 'deterministic',
  chunkIds: 'deterministic'
}
```

目的不是“为了多写两个配置”，而是让构建结果更稳定：

- 模块顺序变化时，尽量不要引发大面积 hash 变化
- 减少无关改动污染缓存

## 10. Webpack 5 里很多项目直接用 `[contenthash]`

例如：

```js
output: {
  filename: 'assets/js/[name].[contenthash:8].js',
  chunkFilename: 'assets/js/[name].[contenthash:8].js'
}
```

这并不代表 `[chunkhash]` 过时了，而是：

- `[chunkhash]` 更适合拿来理解“按 chunk 缓存”
- `[contenthash]` 更常直接出现在现代项目配置中

所以实际工作里，两者都要认识。

## 11. 一套更完整的长期缓存配置思路

```js
output: {
  filename: 'assets/js/[name].[contenthash:8].js',
  chunkFilename: 'assets/js/[name].[contenthash:8].js'
},
optimization: {
  runtimeChunk: 'single',
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',
  splitChunks: {
    chunks: 'all'
  }
}
```

这套组合的目标是：

- 文件名可缓存
- runtime 独立缓存
- 公共依赖稳定拆分
- 无关改动不要让所有文件一起换 hash

## 12. 常见误区

### 误区 1：用了 `[chunkhash]` 就等于长期缓存做完了

不是。真正的长期缓存要看：

- 文件名 hash
- runtime 拆分
- 稳定 id
- 拆包策略
- 静态资源发布策略

### 误区 2：hash 变化越多越正常

也不对。理想情况是：

- 该变的文件变
- 不该变的文件不变

如果一次很小的改动让大量 vendor chunk 一起变 hash，通常说明缓存策略还没配好。

## 13. 结论

`[chunkhash]` 的价值，可以概括成一句话：

让资源文件名跟 chunk 内容绑定，从而让浏览器只重新下载真正变化的文件。

它是 Webpack 生产缓存体系里的关键基础，但必须和下面这些能力一起看，才有真实效果：

- `contenthash`
- `runtimeChunk`
- `deterministic` ids
- `splitChunks`
- 保留旧版本静态资源的发布策略
