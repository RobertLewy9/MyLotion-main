# Day 4 · B1 轨题纸 —— 事件循环（面经校准版 · 20 分钟）

> **归属：Day 4 · B1 轨（前端八股）**
> 2026-10-23 按 8 场面经校准：只保留 B站一面 Q7/Q8、CSIG 一面 Q26 的深度。
> 8 场没有单独追问 `process.nextTick` 与 Promise 的先后、thenable 多 tick、4ms 定时器饥饿、React 18 批处理；这些不再进入必做。
> 合上资料，先口述 Part 1，再写 Part 2 的输出和一句话理由。

## Part 1 · 概念口述

1. 用调用栈、微任务队列、宏任务队列讲清一次事件循环。
2. 宏任务、微任务各举 3 个例子；哪一个先清空？
3. 为什么 `setTimeout(fn, 0)` 不是立刻执行？它要排在什么后面？
4. `await` 后面的代码属于哪种任务？为什么？

## Part 2 · 输出题（写顺序 + 一句话理由）

**Q1**

```js
console.log("start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("end");
```

**Q2**

```js
console.log(1);
new Promise((resolve) => {
  console.log(2);
  setTimeout(() => console.log(3), 0);
  console.log(4);
  resolve();
}).then(() => console.log(5));
console.log(6);
```

**Q3**

```js
async function main() {
  console.log("a");
  await null;
  console.log("b");
}
main();
console.log("c");
Promise.resolve().then(() => console.log("d"));
```

**Q4**

```js
setTimeout(() => console.log("t1"), 0);
Promise.resolve().then(() => {
  console.log("m1");
  Promise.resolve().then(() => console.log("m2"));
});
Promise.resolve().then(() => console.log("m3"));
console.log("sync");
```

## Part 3 · 项目场景（口述 2 分钟）

一个文档对象在同一轮同步操作里被改了 3 次，订阅者不应该收到 3 次通知。
请用「dirty 集合 + 一个微任务 flush」讲清实现，并说明为什么不用 `setTimeout(0)`。

> 只答到「用防抖」算偏题；这里要把“同一轮合并”和“等用户停下”区分开。