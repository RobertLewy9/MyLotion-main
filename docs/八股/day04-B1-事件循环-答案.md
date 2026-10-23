# Day 4 · B1 轨答案 —— 事件循环（面经校准版）

> **归属：Day 4 · B1 轨（前端八股）**
> 依据：B站一面 Q7/Q8（事件循环模型、宏微任务例子）+ CSIG 一面 Q26（给代码说输出）。
> 对应到面试，一般问到“同步 → 微任务 → 宏任务”就够了，不要求数 tick。

## Part 1 · 概念

**1. 整体模型**
同步代码进入调用栈执行；栈清空后，清空微任务队列；之后浏览器有机会渲染，再取一个宏任务；执行完继续清空这一轮产生的微任务，如此循环。

**2. 常见任务**
- 微任务：`Promise.then/catch/finally`、`await` 后面的续体、`queueMicrotask`、`MutationObserver`（了解即可）。
- Node 环境：`process.nextTick`；B站只要求知道它属于微任务，并标注优先级高于 Promise，不考排序。
- 宏任务：`setTimeout`、`setInterval`、I/O 回调、用户事件回调、`<script>` 整体代码。

**3. `setTimeout(fn, 0)`**
它是宏任务，要排在当前同步代码和整条微任务队列之后；不是“立刻”，只是“尽快排到下一轮”。

**4. `await` 后面的代码**
微任务。`await` 右边的表达式先求值；让位的是它后面的续体，promise 落定后进入微任务队列。

## Part 2 · 输出题

**Q1**：`start → end → promise → timeout`
同步先跑完；Promise 回调是微任务；定时器是宏任务。

**Q2**：`1 → 2 → 4 → 6 → 5 → 3`
`new Promise` 的 executor 同步执行；`then` 是微任务；`setTimeout` 是宏任务。
这道题就是 CSIG 一面的输出题同款。

**Q3**：`a → c → b → d`
`main()` 同步执行到 `await null`；`b` 的续体先入微任务队列，随后才注册 `d`，所以 `b` 在 `d` 前。

**Q4**：`sync → m1 → m3 → m2 → t1`
`m1` 执行时新排的 `m2` 进入队尾，要等已经排队的 `m3` 先跑；全部微任务清空后才轮到宏任务。

## Part 3 · 项目场景

核心是“同一轮里的多次修改合并成一次通知”，不是延迟一段时间：

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
    console.log("flush", changed); // 只通知一次
  });
}

notify("doc1");
notify("doc1");
notify("doc1");
// 同一轮同步代码结束后：flush ["doc1"]，只执行一次
```

为什么不用 `setTimeout(0)`：它在下一轮宏任务才执行，会多等一拍，期间还可能插入渲染或其他事件；这里的需求只是“本轮同步修改合并”，微任务正好在栈清空后、渲染前执行。

## 及格线

能讲清 Q1/Q2/Q3/Q4 的输出，并说出“一个宏任务结束后清空微任务，再取下一个宏任务”。不要求背 tick 数或 Node 队列顺序。