# 关于HTML head标签的一些基本知识

## head 标签是 HTML 文档的 元信息区域（metadata），用于描述页面信息、加载资源、配置浏览器行为。这些内容 不会直接显示在页面上，但对 SEO、性能、兼容性、安全、移动端适配非常重要。

1. meta 标签: 用于提供元信息，比如作者、描述、关键词、viewport、字符集、刷新频率等。
2. link 标签: 用于加载外部资源，比如样式表、脚本、图片等。
3. title 标签: 用于设置网页的标题，会显示在浏览器的标题栏、搜索结果、收藏夹等。

```html
<!-- 定义文档的字符集 -->
<meta charset="UTF-8">
<!-- 定义视口，用于移动端适配 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
<!-- 定义网页的描述 -->
<meta name="description" content="这是一个描述"> 
<!-- 定义网页的关键字 -->
<meta name="keywords" content="关键字1,关键字2"> 
<!-- 定义网页的作者 -->
<meta name="author" content="作者"> 
<!-- 定义页面自动刷新时间 -->
<meta http-equiv="refresh" content="5">

<title>网页标题</title> <!-- 定义网页的标题 -->

<link rel="stylesheet" href="style.css"> <!-- 加载外部样式表 -->
<script src="script.js"></script> <!-- 加载外部脚本 -->
```

```js
| 编码         | 说明    |
| ---------- | ----- |
| UTF-8      | 最常用   |
| GBK        | 中文旧编码 |
| ISO-8859-1 | 西方编码  |


| 参数                 | 作用          |
| ------------------ | ----------- |
| width=device-width | 页面宽度 = 设备宽度 |
| initial-scale=1    | 初始缩放        |
| maximum-scale      | 最大缩放        |
| minimum-scale      | 最小缩放        |
| user-scalable=no   | 禁止缩放        |

<link rel="preload" href="main.js" as="script"> <!-- 预加载脚本 -->
提前下载 main.js
但不会立即执行
等 script 标签加载时直接使用缓存
```