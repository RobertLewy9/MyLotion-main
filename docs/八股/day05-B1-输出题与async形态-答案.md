# Day 5 · B1 轨答案 —— `async/await`（面经校准版）

> **归属：Day 5 · B1 轨（前端八股）**
> 依据：腾讯云智一面「`await` 代码在编译后是什么形态」「网络请求回来时在哪个阶段执行」；
> 其余输出题只保留能解释 `async` 与 Promise 时机的代表题。

## Part 1 · 概念

**1. 从哪一行让位？**
`async` 函数被调用后，函数体**同步开始执行**，一直跑到第一个 `await`。到 `await` 时，
右边表达式先求值，后面的续体挂到 Promise 上，当前调用栈继续往下走。

**2. 续体和错误**
`await` 后面的代码是**微任务续体**；promise 落定后进入微任务队列。
`async` 函数里 `throw` 不会同步抛给调用者，而是让返回的 Promise 变成 rejected，所以外面用 `.catch` 或 `try/catch + await` 接。

**3. 编译后的形态**
可以理解为 **generator + 自动执行器**：`await` 被拆成让出执行权和恢复执行的点，外层 runner 等 Promise 落定后再 `next(value)`。面试说清这个结构即可，8 场面经没有要求现场手写 runner。

## Part 2 · 输出题

**Q1**：`start → f → end`
调用 `async` 函数不等于把整个函数体推迟；函数体先同步执行。

**Q2**：`sync → caught x → after`
`f()` 先同步跑到 `await`；rejection 进入微任务，`catch` 接住后同一段续体继续执行 `after`。

**Q3**：`sync → all 1,2 → race 1`
两个 `then` 都是微任务，按注册顺序执行；`race` 取最先落定的值。

## Part 3 · 项目场景

```js
const [messages, sidebar] = await Promise.all([
  fetchMessages().catch(() => []),
  fetchSidebar().catch(() => []),
]);
```

先并行发请求，避免串行等待；每个请求单独 `.catch`，保证一边失败不会把整个页面打空。
这就是 `Promise.all` 的“并发 + 分别兜底”写法，不需要在面试里展开手写 `allSettled`。

## 及格线

能说清「`async` 同步跑到第一个 `await`」「`await` 后续体是微任务」「`Promise.all` 并行但要分别兜底”。