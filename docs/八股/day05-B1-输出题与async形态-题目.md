# Day 5 · B1 题纸 —— 代码输出题实战 + `async/await` 形态

> **归属：Day 5 · B1 轨（前端八股）**
> 合上资料，计时 40 分钟。Part 1 口述，Part 2 写输出 + 一句话理由，Part 3 要说出数字。
> 答完发我，我对答案 + 打分。标准答案在 `day05-B1-输出题与async形态-答案.md`，**别提前看**。
>
> 考点定位：`docs/B1-前端八股考点.md` A 节「`async/await` 编译后是什么形态、`await` 之后的代码在哪个阶段执行」（腾讯云智一面）
> + 「`Promise` 状态、`then` 的微任务时机」。

## Part 1 · 概念口述

1. `async` 函数被调用后，函数体是同步执行还是异步执行？从哪一行开始「让位」？
2. `async` 函数的返回值是什么？`return 1` 和 `return Promise.resolve(1)` 有区别吗？
3. `await` 后面的代码在哪个阶段执行？为什么？
4. `async/await` 编译成 ES5 后大致是什么形态？（提示：generator + 自动执行器）
5. `async` 函数里 `throw` 一个错误，外面怎么接住？和普通函数抛错有什么区别？
6. `try/catch` 能接住 `await` 一个 rejected promise 的错误吗？为什么能？

## Part 2 · 写输出 + 一句话理由

**Q1**

```js
async function f() { console.log("f"); }
console.log("start");
f();
console.log("end");
```

**Q2**

```js
async function f() { return 1; }
f().then((v) => console.log("then", v));
console.log("sync");
```

**Q3**

```js
async function f() { console.log("a"); await null; console.log("b"); }
f();
console.log("c");
```

**Q4**

```js
async function f() { throw new Error("boom"); }
f().catch((e) => console.log("caught:", e.message));
console.log("sync");
```

**Q5**

```js
async function f() {
  try { await Promise.reject(new Error("x")); } catch (e) { console.log("caught", e.message); }
  console.log("after");
}
f();
console.log("sync");
```

**Q6**

```js
const p1 = Promise.resolve("1");
const p2 = Promise.resolve("2");
Promise.all([p1, p2]).then((r) => console.log("all", r.join(",")));
Promise.race([p1, p2]).then((r) => console.log("race", r));
console.log("sync");
```

## Part 3 · 场景题（要说出数字）

**S1** 下面两段各耗时多少？为什么差这么多？

```js
// A
async function loadA() { const a = await fetchOne(); const b = await fetchOne(); return [a, b]; }

// B
async function loadB() { const [a, b] = await Promise.all([fetchOne(), fetchOne()]); return [a, b]; }
```

（假设 `fetchOne()` 是一个固定 30ms 的异步请求）

**S2** MyLotion 的 AI 面板要同时拉「历史消息」和「文档树」。你会怎么写？为什么？

**S3** `await` 写在 `for` 循环里逐个请求，和 `Promise.all` 一次性发，除了耗时还有什么区别？（提示：失败处理、限流、内存）

## Part 4 · 追问自测（加分项）

Z1. `Promise.all` 其中一个失败会怎样？`Promise.allSettled` 呢？
Z2. 手写 `async/await`：用 generator + 自动执行器把 `await` 描述出来。
Z3. `await` 一个「已经是 resolved」的原生 promise，会额外多等几个 tick？

## Part 5 · 简历落地自测（必答 —— 面试官就按这个问）

> 来源：在腾讯做 Agent 开发实习的朋友 ——「他只会看着你简历问呀」。
> 逐词映射表见 `docs/全轨-简历映射.md`，固定骨架：**① 在我项目里干什么 → ② 完整流程走一遍 → ③ 为什么选它、不用 X**。

**L1** 挑一条**和今天考点挂着**的简历词（今天讲 `async/await` 与微任务时机，能挂的有：
「请求去重 `pendingById`」「AI 面板并发拉历史与文档树」「流式输出的消费侧」），合上资料讲 2 分钟。

**L2** 追问预演（面试官必然往下追一层）：
- 「同一篇文档同时发起两次 `getById`，第二次会怎样？」—— 要讲出 `pendingById` 命中 / 未命中两条分支
- 「文档树为什么是**前端懒加载 + 后端按 `parentId` 按需返回**，而不是一次拉全量？」

**L3** 哪条讲不满 2 分钟、卡在第几段 —— 记进 `docs/日志/dayNN-全轨-日志.md`，并写清要补的材料。
