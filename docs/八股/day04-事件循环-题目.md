# Day 4 · B 轨题纸 —— 事件循环：宏 / 微任务 + Promise 时机

> 用法：**合上一切资料**。先口述 Part 1，再手写 Part 2 的输出，最后答 Part 3。全程计时 60 分钟。
> 答完把结果发我，我对答案 + 打分 + 补漏。标准答案在 `docs/八股/day04-事件循环-答案.md`，**别提前看**。
>
> 考点定位：`docs/面经考点.md` A 节第 1 条（★★★）—— B站 / CSIG / 腾讯云智一面都出过。

---

## Part 1 · 概念口述（每题 1 分钟，讲「是什么 + 为什么」）

1. 讲出事件循环的整体模型：调用栈、微任务队列、宏任务队列三者是什么关系？
2. 宏任务和微任务各有哪些？每类至少说出 3 个。
3. 为什么 `setTimeout(fn, 0)` 不是「立刻执行」？它到底排在什么位置？
4. 微任务队列什么时候被清空？如果清空过程中又产生了新的微任务，怎么办？
5. 浏览器的渲染发生在事件循环的哪一步？为什么微任务写多了会卡页面？
6. `await` 后面的代码属于哪种任务？为什么？
7. 微任务里无限递归会产生什么后果？它和宏任务的无限递归表现一样吗？

## Part 2 · 输出题（写输出顺序 + 一句话理由）

> 只写输出不给理由，算一半分。

**Q1**

```js
console.log("start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("end");
```

**Q2**

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve()
  .then(() => { console.log("C"); return Promise.resolve(); })
  .then(() => console.log("D"));
console.log("E");
```

**Q3**

```js
Promise.resolve()
  .then(() => { console.log("1"); return Promise.resolve("x"); })
  .then(() => console.log("2"));
Promise.resolve().then(() => console.log("3")).then(() => console.log("4")).then(() => console.log("5"));
```

**Q4**

```js
async function f() { console.log("f"); return 1; }
f().then(() => console.log("then"));
console.log("sync");
```

**Q5**

```js
async function y() { console.log("y1"); await x(); console.log("y2"); }
async function x() { console.log("x"); }
console.log("s1");
y();
console.log("s2");
```

**Q6**

```js
setTimeout(() => console.log("t1"), 0);
Promise.resolve().then(() => { console.log("m1"); Promise.resolve().then(() => console.log("m2")); });
Promise.resolve().then(() => console.log("m3"));
console.log("sync");
```

**Q7**

```js
queueMicrotask(() => console.log("qm"));
setTimeout(() => console.log("st"), 0);
Promise.resolve().then(() => console.log("p"));
```

**Q8**

```js
const thenable = { then(res) { res(); } };
(async () => { await thenable; console.log("await thenable"); })();
Promise.resolve().then(() => console.log("a")).then(() => console.log("b")).then(() => console.log("c"));
```

**Q9**

```js
setTimeout(() => { console.log("t1"); Promise.resolve().then(() => console.log("m-in-t1")); }, 0);
setTimeout(() => console.log("t2"), 0);
console.log("sync");
```

**Q10**

```js
console.log("1");
const p = new Promise((res) => { console.log("2"); res(); });
p.then(() => console.log("3"));
setTimeout(() => console.log("4"), 0);
console.log("5");
```

**Q11**

```js
async function main() { console.log("a"); await null; console.log("b"); }
main();
console.log("c");
Promise.resolve().then(() => console.log("d"));
```

**Q12**

```js
setTimeout(() => { console.log("outer"); setTimeout(() => console.log("inner"), 0); }, 0);
console.log("sync");
```

## Part 3 · 场景题（结合 MyLotion，每题 2~3 分钟口述）

S1. 一个文档对象一秒内被改了 3 次，订阅者不该被通知 3 次。用「微任务合并」的思路讲清实现，并说明为什么不用 `setTimeout(0)` 做这件事。

S2. AI 面板每秒收到 100 个 SSE token，你要把渲染压下来。选宏任务还是微任务？为什么？React 18 的自动批处理在这里帮了什么忙？

S3. `debounce` 和「微任务合并」都能把多次调用攒起来，它们的区别是什么？各自适合什么场景？如果 `debounce` 用微任务实现，会出什么问题？

## Part 4 · 追问自测（答得上来算加分项）

Z1. `process.nextTick` 和 `Promise.then` 谁先执行（Node）？Node 为什么要单独搞一条 `nextTick` 队列？

Z2. 浏览器的宏任务队列只有一条吗？`setTimeout` 到点了就一定立刻执行吗？「4ms 最小延迟」和「定时器饥饿」是怎么回事？

Z3. 如果微任务永远清不完会怎样？如果宏任务永远排不完又会怎样？为什么两者表现不同？

Z4. React 18 的自动批处理是怎么跟事件循环挂钩的？为什么放在 `setTimeout` 里的两次 `setState` 会被合并，而 React 17 里不会？

---

答完发我，我逐题对答案并打分。