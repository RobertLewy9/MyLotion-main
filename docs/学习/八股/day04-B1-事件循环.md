# Day 4 · B1 轨 —— 事件循环（问答一体）

> **归属：Day 4 · B1 轨（前端八股）**
> 依据：B站一面 Q7/Q8（事件循环模型、宏微任务例子）+ CSIG 一面 Q26（给代码说输出）。
> 用法：先遮住每题「参考答案」口述，答完再对照；面试只需讲到“同步 → 微任务 → 宏任务”，不要求数 tick。

## 思维导图

```text
事件循环
├─ 执行顺序：同步代码 → 清空微任务 → 渲染机会 → 取一个宏任务
├─ 微任务：Promise.then/catch/finally、await 续体、queueMicrotask
│  └─ 本轮新排入的微任务，排到本轮队尾，仍在本轮清空
├─ 宏任务：setTimeout、setInterval、I/O、用户事件、整段 script
└─ 判断口诀：先同步，再微任务，后宏任务
```

## Part 1 · 概念

### Q1. 用调用栈、微任务队列、宏任务队列讲清一次事件循环

**参考答案（口述）**

1. 同步代码进入调用栈，按顺序执行。
2. 调用栈清空后，先清空整条微任务队列。
3. 浏览器获得一次渲染机会。
4. 再取一个宏任务执行；它结束后继续清空本轮产生的微任务，如此循环。

**一句话：** 一次事件循环不是“同步完了就直接跑定时器”，中间还有完整的微任务清空和渲染机会。

### Q2. 宏任务、微任务各举 3 个例子；哪一个先清空？

- 微任务：`Promise.then/catch/finally`、`await` 后面的续体、`queueMicrotask`。
- 了解项：`MutationObserver`；Node 的 `process.nextTick` 也属于微任务，优先级高于 Promise，但不要求背排序。
- 宏任务：`setTimeout`、`setInterval`、I/O 回调、用户事件回调、整段 `<script>`。

**答案：** 当前宏任务结束后，先清空微任务队列，再取下一个宏任务。

### Q3. 为什么 `setTimeout(fn, 0)` 不是立刻执行？

**参考答案（口述）**

因为它是宏任务，要排在：

1. 当前同步代码之后；
2. 当前这一轮全部微任务之后；
3. 浏览器完成必要的渲染和其他工作之后。

所以 `0` 只表示“尽快排到下一轮宏任务”，不保证 0ms 后立即执行。

### Q4. `await` 后面的代码属于哪种任务？为什么？

**参考答案（口述）**

属于**微任务续体**。

`await` 右边的表达式先求值；函数在这里让出执行权。Promise 落定后，`await` 后面的代码被放入微任务队列，等当前调用栈清空后执行。

## Part 2 · 输出题

### Q1. 基础输出顺序

```js
console.log("start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("end");
```

**答案：** `start → end → promise → timeout`

**理由：** 同步代码先跑完；Promise 回调是微任务；定时器是宏任务。

### Q2. 构造函数 `Promise` 与 `then`

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

**答案：** `1 → 2 → 4 → 6 → 5 → 3`

**理由：** `new Promise(executor)` 的 executor 同步执行；`then` 回调是微任务；`setTimeout` 是宏任务。这道题与 CSIG 一面输出题同型。

### Q3. `async/await` 与微任务注册顺序

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

**答案：** `a → c → b → d`

**理由：** `main()` 同步执行到 `await null`；`b` 的续体先进入微任务队列，之后才注册 `d`。

### Q4. 微任务中再排微任务

```js
setTimeout(() => console.log("t1"), 0);
Promise.resolve().then(() => {
  console.log("m1");
  Promise.resolve().then(() => console.log("m2"));
});
Promise.resolve().then(() => console.log("m3"));
console.log("sync");
```

**答案：** `sync → m1 → m3 → m2 → t1`

**理由：** `m1` 执行时新排的 `m2` 进入队尾；已经排队的 `m3` 先执行。整条微任务队列清空后，才轮到宏任务 `t1`。

## Part 3 · 项目场景

### Q. 同一轮同步操作改了文档 3 次，订阅者怎样只收到 1 次通知？为什么不用 `setTimeout(0)`？

**参考答案（口述）**

用 `dirty Set + 一个微任务 flush`：

1. 每次修改只把文档 id 放进 `dirty`。
2. 第一次修改时安排一个微任务，后续修改只累积 id。
3. 微任务执行时取出并清空 `dirty`，统一通知一次。

```js
let scheduled = false;
const dirty = new Set();

function notify(id) {
  dirty.add(id);
  if (scheduled) return;
  scheduled = true;
  Promise.resolve().then(() => {
    scheduled = false;
    const changed = [...dirty];
    dirty.clear();
    console.log("flush", changed);
  });
}

notify("doc1");
notify("doc1");
notify("doc1");
// 同一轮同步代码结束后：flush ["doc1"]，只通知一次
```

**为什么不用 `setTimeout(0)`：** 它要等下一轮宏任务，会多等一拍，期间还可能插入渲染或其他事件。这里的语义是“合并本轮同步修改”，微任务正好在栈清空后、渲染前执行。

> 和防抖的区别：微任务合并的是“同一轮修改”；防抖等待的是“用户停止输入”，场景不同。

## 30 秒复盘

同步代码先执行；栈清空后先清空所有微任务，再给渲染机会，然后取一个宏任务。`setTimeout` 是宏任务，`Promise.then` 和 `await` 后续体是微任务。微任务中新建的任务排到本轮队尾，但仍会在下一个宏任务前执行完。项目里可用 `dirty Set + 微任务` 合并同一轮文档修改。

## 自测清单

- [ ] 能画出“同步栈 → 微任务 → 渲染 → 宏任务”的循环。
- [ ] 能说清 `setTimeout(0)`、`Promise.then`、`await` 续体的先后。
- [ ] 能解释 Q1–Q4 的输出，而不是只背结果。
- [ ] 能讲清 `dirty Set + 微任务 flush`，并说明它和防抖的区别。
