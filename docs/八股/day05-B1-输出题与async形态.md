# Day 5 · B1 轨 —— `async/await`（问答一体）

> **归属：Day 5 · B1 轨（前端八股）**
> 依据：腾讯云智一面「`await` 代码在编译后是什么形态」「网络请求回来时在哪个阶段执行」。
> 用法：先口述每题，再看答案；重点掌握“同步跑到第一个 `await`、续体是微任务”。

## 思维导图

```text
async / await
├─ 调用：函数体同步开始
├─ 让位：执行到第一个 await
├─ 恢复：Promise 落定后，续体进微任务队列
├─ 错误：async 内的 throw → rejected Promise
└─ 编译形态：generator + 自动执行器
```

## Part 1 · 概念

### Q1. 调用 `async` 函数后，函数体是同步还是异步？从哪一行让位？

**参考答案（口述）**

`async` 函数被调用后，函数体**同步开始执行**，一直跑到第一个 `await`。

到 `await` 时：

1. 右边表达式先求值；
2. 后面的续体挂到这个 Promise 上；
3. 当前调用栈继续往下走。

**一句话：** 调用 `async` 函数不等于把整个函数体推迟。

### Q2. `await` 后面的代码属于哪种任务？`async` 里 `throw` 的错误怎么接？

**参考答案（口述）**

`await` 后面的代码是**微任务续体**；Promise 落定后进入微任务队列。

`async` 函数里的 `throw` 不会同步抛给调用者，而是让返回的 Promise 变成 rejected。所以外面用 `.catch`，或在 `async` 函数里用 `try/catch + await` 接。

### Q3. `async/await` 编译后大致是什么形态？

**参考答案（口述）**

可以理解为 **generator + 自动执行器**：

- `await` 被拆成“让出执行权”和“恢复执行”的点；
- 外层 runner 等 Promise 落定后调用 `next(value)`。

面试说清这个结构即可，不要求现场手写 runner。

## Part 2 · 输出题

### Q1. 没有 `await` 的 `async` 函数

```js
async function f() { console.log("f"); }
console.log("start");
f();
console.log("end");
```

**答案：** `start → f → end`

**理由：** 调用 `async` 函数时，函数体先同步执行；没有遇到 `await` 就不会暂停。

### Q2. `await` 遇到 rejection

```js
async function f() {
  try {
    await Promise.reject(new Error("x"));
  } catch (e) {
    console.log("caught", e.message);
  }
  console.log("after");
}
f();
console.log("sync");
```

**答案：** `sync → caught x → after`

**理由：** `f()` 先同步跑到 `await`；rejection 进入微任务，`catch` 接住后，同一段续体继续执行 `after`。

### Q3. `Promise.all` 与 `Promise.race`

```js
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
Promise.all([p1, p2]).then((r) => console.log("all", r.join(",")));
Promise.race([p1, p2]).then((r) => console.log("race", r));
console.log("sync");
```

**答案：** `sync → all 1,2 → race 1`

**理由：** 两个 `then` 都是微任务，按注册顺序执行；`race` 取最先落定的值。

## Part 3 · 项目场景

### Q. AI 面板同时拉历史消息和文档树，代码怎么写？两个都失败时怎样仍显示聊天记录？

**参考答案（口述）**

```js
const [messages, sidebar] = await Promise.all([
  fetchMessages().catch(() => []),
  fetchSidebar().catch(() => []),
]);
```

1. 用 `Promise.all` 并行发请求，避免串行等待。
2. 每个请求单独 `.catch` 兜底，一边失败不会把整个页面打空。
3. 历史消息失败回退为空数组时，界面仍可显示骨架或本次新消息；文档树失败则保留上次缓存或空树。

这就是“并发 + 分别兜底”，面试不要求展开手写 `allSettled`。

## 30 秒复盘

`async` 函数同步跑到第一个 `await`；`await` 后续体是微任务；函数内 `throw` 会让返回的 Promise 变成 rejected。编译形态可以理解为 generator + 自动执行器。项目里并发请求用 `Promise.all`，每个请求单独 `catch`，保证局部失败不拖垮整个页面。

## 自测清单

- [ ] 能说清 `async` 函数从哪一行让位。
- [ ] 能解释 `await` 续体、微任务和错误传播。
- [ ] 能说出 generator + runner 的编译形态。
- [ ] 能写出 `Promise.all + 分别兜底` 的项目代码。
