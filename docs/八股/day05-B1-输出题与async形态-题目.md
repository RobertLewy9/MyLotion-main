# Day 5 · B1 轨题纸 —— `async/await`（面经校准版 · 20 分钟）

> **归属：Day 5 · B1 轨（前端八股）**
> 2026-10-23 按 8 场面经校准：腾讯云智一面只问了「`await` 代码在哪个阶段执行」和「编译后的形态」。
> 不再要求手写 generator 自动执行器，也不要求数 thenable 多等几个 tick。

## Part 1 · 概念口述

1. 调用一个 `async` 函数后，函数体是同步执行还是异步执行？从哪一行开始让位？
2. `await` 后面的代码属于哪种任务？`async` 函数里 `throw` 的错误怎么接？
3. `async/await` 编译后大致是什么形态？用一句话说清，不手写实现。

## Part 2 · 输出题（写顺序 + 一句话理由）

**Q1**

```js
async function f() { console.log("f"); }
console.log("start");
f();
console.log("end");
```

**Q2**

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

**Q3**

```js
const p1 = Promise.resolve("1");
const p2 = Promise.resolve("2");
Promise.all([p1, p2]).then((r) => console.log("all", r.join(",")));
Promise.race([p1, p2]).then((r) => console.log("race", r));
console.log("sync");
```

## Part 3 · 项目场景（必答）

MyLotion 的 AI 面板要同时拉「历史消息」和「文档树」。代码应该怎么写？
如果两个请求都失败，怎么让聊天记录仍然能显示？

> 答到 `Promise.all` 和“分别兜底”即可，不要求背 `allSettled` 的完整返回结构。