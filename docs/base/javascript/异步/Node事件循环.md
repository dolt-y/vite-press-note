# Node.js 事件循环

## 1. 先和浏览器区分开

Node.js 的事件循环和浏览器有共同点:

- 都会执行同步代码
- 都会处理异步回调
- 都有微任务

但 Node.js 的重点不是页面渲染，而是:

- 定时器
- 文件 I/O
- 网络 I/O
- `setImmediate`
- `process.nextTick`

所以复习时不要把浏览器和 Node 的执行顺序混成一套。

## 2. Node.js 事件循环的核心

Node.js 的事件循环建立在 `libuv` 之上。

可以先把它理解成:

- JS 主线程执行代码
- 底层把文件、网络、定时器等异步能力交给系统或 `libuv`
- 异步任务完成后，再把对应回调放回事件循环的不同阶段执行

也就是说，Node.js 的重点不是渲染，而是如何高效调度 I/O。

## 3. Node.js 的主要阶段

Node.js 官方常用的简化顺序是:

1. `timers`
2. `pending callbacks`
3. `idle, prepare`
4. `poll`
5. `check`
6. `close callbacks`

最常接触的是这几个:

- `timers`: 执行 `setTimeout`、`setInterval` 到期的回调
- `poll`: 处理大多数 I/O 回调，比如文件、网络
- `check`: 执行 `setImmediate`
- `close callbacks`: 执行一些关闭资源时的回调，比如 socket 的 `close`

可以先记成:

`timers -> pending -> poll -> check -> close`

但这只是简化记忆，不是说所有情况都机械地“一步一步只执行一个回调”。每个阶段都有自己的队列，Node 会按阶段规则把队列里的回调依次取出来执行。

## 4. `process.nextTick()` 不属于普通阶段

这是 Node.js 最容易和浏览器搞混的地方。

`process.nextTick()` 严格来说不算事件循环普通 phase 里的内容，它会在:

`当前操作结束后，事件循环继续前，优先执行`

所以它的优先级非常高。

例如 CommonJS 里:

```js
const { nextTick } = require("node:process");

console.log("start");

nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));

console.log("end");
```

输出通常是:

```js
start
end
nextTick
promise
```

也就是说在 Node 里，常见 CommonJS 场景下:

- 先执行同步代码
- 再清空 `nextTick queue`
- 再清空 Promise microtask queue
- 再进入后续事件循环阶段

## 5. `Promise.then` 和 `queueMicrotask`

Node.js 也有微任务队列，`Promise.then` 和 `queueMicrotask` 都属于这一类。

通常可以先记住:

- `process.nextTick` 优先级高于 Promise 微任务
- Promise 微任务优先于 `setTimeout`、`setImmediate`

但这里有一个细节:

- 在 CommonJS 中，通常是 `nextTick` 先于 Promise 微任务
- 在 ESM 中，由于模块本身就处在微任务处理过程中，某些例子里 `Promise.then / queueMicrotask` 可能会先于 `process.nextTick`

所以如果你在背面试题，最好注明运行环境:

- 是浏览器还是 Node
- 是 CommonJS 还是 ESM
- Node 版本是多少

## 6. `setImmediate()` 是什么

`setImmediate()` 是 Node.js 特有的一个常见调度 API，它的回调会在 `check` 阶段执行。

最实用的理解:

- `setTimeout(fn, 0)` 是尽快进入后续的 `timers`
- `setImmediate(fn)` 是尽快进入后续的 `check`

它们都不是“立刻执行”，都要等当前同步代码跑完。

## 7. `setImmediate()` 和 `setTimeout(fn, 0)` 谁先执行

如果你把它们直接写在主模块里:

```js
setTimeout(() => {
  console.log("timeout");
}, 0);

setImmediate(() => {
  console.log("immediate");
});
```

顺序不应该死记硬背。

在主模块顶层场景下，它们的先后顺序可能受运行时环境影响，不能简单保证谁一定先执行。

但是如果把它们放进 I/O 回调里:

```js
const fs = require("node:fs");

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log("timeout");
  }, 0);

  setImmediate(() => {
    console.log("immediate");
  });
});
```

这里通常是:

```js
immediate
timeout
```

原因是:

- I/O 回调主要在 `poll` 阶段处理
- `poll` 阶段结束后会先进入 `check`
- `setImmediate` 正好就在 `check` 阶段执行
- `setTimeout` 要等后续 `timers` 阶段

## 8. Node.js 20+ 的一个版本差异

从 `libuv 1.45.0` 开始，也就是 Node.js 20 这一代开始，定时器调度行为有一个需要知道的变化:

- 旧版本里，timers 的执行点和 poll 的关系更复杂
- Node.js 20+ 中，官方文档特别说明 timers 改为在 poll 之后运行

这会影响一些边界场景里 `setImmediate()` 和 `setTimeout()` 的先后表现。

所以如果你看到不同文章里的结论不一样，先看它写的是哪个 Node 版本。

## 9. Node.js 常见顺序总结

先记这个实用版本:

1. 执行同步代码
2. 执行 `process.nextTick`
3. 执行 Promise 微任务 / `queueMicrotask`
4. 进入事件循环各阶段
5. 在合适阶段执行 `setTimeout`、I/O、`setImmediate`、`close`

## 10. 一道 Node 常见题

```js
const { nextTick } = require("node:process");

console.log("start");

setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));

Promise.resolve().then(() => console.log("promise"));
nextTick(() => console.log("nextTick"));

console.log("end");
```

一个稳妥的理解方式不是硬背完整顺序，而是先抓住确定部分:

- `start`
- `end`
- `nextTick`
- `promise`

这四个的相对顺序通常是稳定的:

```js
start
end
nextTick
promise
```

至于 `timeout` 和 `immediate`，顶层场景不要轻易断言绝对先后。

## 11. 和浏览器最容易混淆的点

- 浏览器里常讲“宏任务 / 微任务 / 渲染”
- Node.js 里更适合讲“phase 阶段 + nextTick + 微任务”
- 浏览器没有 `process.nextTick`
- Node.js 有 `setImmediate`
- 浏览器强调页面刷新时机，Node.js 强调 I/O 调度

## 12. 一句话总结

Node.js 事件循环可以先记成:

`同步代码 -> nextTick -> Promise 微任务 -> timers / poll / check 等阶段`
