# Day 5 · B1 答案 —— 代码输出题 + `async/await` 形态（口述版）

> 全部输出与耗时均为**本机 Node 实跑**（2026-10-19），不是背的。
> 答法统一：**先说结论 → 再说一句为什么 → 面试官追问时再展开推演**。
> 口述原则：术语要用（微任务、tick、resolve、rejection），但每个术语第一次出现时用半句话解释掉。

## Part 1 · 概念口述

### 1. `async` 函数被调用后，函数体是同步还是异步？从哪一行开始「让位」？

**一句话**：同步执行，一直跑到**第一个 `await`** 才让位。

**展开**：调用 `async` 函数会立刻开始执行函数体，和普通函数没区别；碰到 `await` 时，
先把 `await` **右边**的表达式求值（这一步也是同步的），然后函数暂停，返回一个 pending 的 promise，
`await` 后面的代码被包成回调，进**微任务队列**，等当前同步代码跑完再继续。

**追问**：`await` 右边如果是 `fetch()`，请求是那一刻就发出去的吗？—— 是的，先求值再让位，
所以「发请求」是同步发生的，「等结果」才是异步的。

### 2. `async` 函数的返回值是什么？`return 1` 和 `return Promise.resolve(1)` 有区别吗？

**一句话**：永远返回一个 promise；**最终值一样，时机不一样**。

**展开**：`return 1` 相当于 `Promise.resolve(1)`，promise 立刻 fulfilled；
`return Promise.resolve(1)` 会多一层「解包」（promise 套 promise），多经过几个微任务 tick 才 fulfilled。

**实测**：在 6 个空 `then` 之后才轮到 `return Promise.resolve(1)` 的那个 `then` 回调，
`return 1` 的回调则在第一个。**工程上别依赖这个顺序**，只要知道「多一层解包、晚一点」就够了。

### 3. `await` 后面的代码在哪个阶段执行？为什么？

**一句话**：在**微任务**阶段执行。

**展开**：`await` 的语义是「把后面的代码挂到 promise 的 `then` 上」，而 `then` 的回调本来就是微任务；
所以 `await` 之后的代码不是同步的，但它**优先于任何宏任务**（`setTimeout`、I/O 回调）。

**追问**：那 `await` 和 `Promise.then` 有什么区别？—— 本质是同一套微任务机制，
`await` 只是语法糖，外加把「暂停/恢复」写成了同步代码的样子。

### 4. `async/await` 编译成 ES5 后大致是什么形态？

**一句话**：**generator + 自动执行器**。

**展开**：Babel / TypeScript 降级时，`async` 函数变成 `function*`，`await` 变成 `yield`，
外面套一个 runner：每次 `next()` 拿到 `yield` 出来的 promise，`.then` 之后再 `next(value)` 把结果送回去；
抛错就 `throw` 回 generator，被 `try/catch` 接住。

```js
async function f() { const a = await g(); return a + 1; }

// 降级后（示意，真实产物是 __awaiter + __generator）
function f() {
  return runner(function* () {
    const a = yield g();
    return a + 1;
  });
}
```

**加分点**：说清「`await` 只是暂停点，真正驱动它的是外面的执行器」，就说明你不是只会用语法。

### 5. `async` 函数里 `throw` 一个错误，外面怎么接住？和普通函数有什么区别？

**一句话**：`async` 里的 `throw` **不会同步抛出**，而是让返回的 promise 变成 **rejected**。

**展开**：普通函数 `throw`，调用点当场中断，必须用 `try/catch` 包住调用；
`async` 函数里 `throw`，等价于 `return Promise.reject(err)`，外面用 `.catch()` 或者
`try { await f() } catch (e) {}` 接。两条路最终都落在同一个 rejection 上。

**追问**：没接会怎样？—— unhandled rejection，Node 里会告警甚至退出（取决于版本和配置），不是静默的。

### 6. `try/catch` 能接住 `await` 一个 rejected promise 的错误吗？为什么能？

**一句话**：能。因为 `await` 会把 rejection **当作当前执行上下文的异常抛出来**。

**展开**：`await p` 在 p rejected 时，等价于在那一行 `throw reason`，所以外层的 `try/catch`
自然能接；这也是 `async/await` 比 `.then().catch()` 好读的地方 —— 异步错误走同步的写法。

## Part 2 · 输出题（实跑结果）

### Q1

```js
async function f() { console.log("f"); }
console.log("start");
f();
console.log("end");
```

**输出**：`start` → `f` → `end`

**一句话理由**：函数体在调用时同步执行，`f` 里面没有 `await`，所以整段都是同步的。

### Q2

```js
async function f() { return 1; }
f().then((v) => console.log("then", v));
console.log("sync");
```

**输出**：`sync` → `then 1`

**一句话理由**：`return 1` 让 promise 立刻 fulfilled，但 `.then` 的回调是**微任务**，排在同步代码之后。

### Q3

```js
async function f() { console.log("a"); await null; console.log("b"); }
f();
console.log("c");
```

**输出**：`a` → `c` → `b`

**一句话理由**：`a` 是同步的；`await null` 也会让位一次，`b` 进微任务，所以 `c` 先出。

**注意**：`await null` 不是「没有 await」—— 任何 `await` 都会产生一个微任务边界，这点常考。

### Q4

```js
async function f() { throw new Error("boom"); }
f().catch((e) => console.log("caught:", e.message));
console.log("sync");
```

**输出**：`sync` → `caught: boom`

**一句话理由**：`throw` 变成 rejection，`.catch` 是微任务；函数体本身同步执行到 `throw` 为止。

### Q5

```js
async function f() {
  try { await Promise.reject(new Error("x")); } catch (e) { console.log("caught", e.message); }
  console.log("after");
}
f();
console.log("sync");
```

**输出**：`sync` → `caught x` → `after`

**一句话理由**：`await` 把 rejection 变成当前上下文的异常，`catch` 和后面的 `after` 都在同一段微任务续体里，接着同步往下走。

### Q6

```js
const p1 = Promise.resolve("1");
const p2 = Promise.resolve("2");
Promise.all([p1, p2]).then((r) => console.log("all", r.join(",")));
Promise.race([p1, p2]).then((r) => console.log("race", r));
console.log("sync");
```

**输出**：`sync` → `all 1,2` → `race 1`

**一句话理由**：两个 `then` 都是微任务，按**注册顺序**先进先出；`all` 先注册所以先出，`race` 取第一个值 `1`。

## Part 3 · 场景题（要说出数字）

### S1 串行 vs `Promise.all`，各耗时多少？

**理论值**：两个 30ms 的请求 —— 串行 `30 + 30 = 60ms`，并行 `max(30, 30) = 30ms`，**差一倍**。

**实测**（本机 Node，`setTimeout(30)` ×2，各跑 3 次）：

| 写法 | 实测耗时 |
|------|----------|
| 串行 `await a; await b` | 74 / 82 / 122 ms |
| `await Promise.all([a, b])` | 31 / 45 / 45 ms |

**为什么差这么多**：串行是「等第一个回来，才发第二个」，两段延迟**叠加**；
`Promise.all` 是**同时发**，总耗时取决于最慢的那个。实测比理论多出来的部分是定时器和事件循环的开销，
但「串行约等于两倍」这个结论不变。

**什么时候不能并行**：第二个请求依赖第一个的结果（比如先拿文档 id 再拉详情），那就只能串行。

### S2 MyLotion 的 AI 面板要同时拉「历史消息」和「文档树」，怎么写？

**答**：`Promise.all([fetchMessages(), fetchSidebar()])`，两者互不依赖，没必要串。
但要**分别兜底**：文档树失败不该拖垮聊天记录，所以更稳的是 `Promise.allSettled`，
或者两个 promise 各自 `.catch(() => 默认值)` 再 `Promise.all`。

### S3 `await` 写在 `for` 循环里，和 `Promise.all` 一次性发，除了耗时还有什么区别？

**答**，四个点：

1. **失败处理**：串行遇到第一个失败可以立刻停，已完成的保留；`Promise.all` 是「快速失败」，
   一失败整体 reject，但**其他请求还在飞**，而且没法取消（除非用 `AbortController`）。
2. **限流**：`Promise.all` 一次性全发，量大了容易打爆后端、触发 429；串行天然限流。
   真要并发又要限流，用并发池（`p-limit` 那类）。
3. **内存**：`Promise.all` 要同时持有所有 promise 和所有结果；串行只需要当前这一份。
4. **顺序依赖**：串行可以「边算边用前一个结果」提前退出；并行做不到。

## Part 4 · 追问自测

### Z1 `Promise.all` 其中一个失败会怎样？`Promise.allSettled` 呢？

`all` 一失败就整体 reject，拿到第一个失败的原因，**其余请求不会取消**；
`allSettled` 等全部结束，返回数组，每项是 `{ status: "fulfilled", value }` 或
`{ status: "rejected", reason }`，适合「部分失败也要展示」的场景。

### Z2 用 generator + 自动执行器把 `await` 描述出来

```js
function runner(gen) {
  return new Promise((resolve, reject) => {
    function step(value) {
      let r;
      try { r = gen.next(value); } catch (e) { return reject(e); }
      if (r.done) return resolve(r.value);
      Promise.resolve(r.value).then(step, reject);
    }
    step();
  });
}

function* main() {
  const a = yield Promise.resolve(1);
  const b = yield Promise.resolve(2);
  return a + b;
}

runner(main()).then(console.log); // 3
```

关键点：`yield` 交出 promise，`then` 回调里 `next(value)` 把结果送回去；
`reject` 直接交给生成器的 `throw` 路径（真实实现里是 `gen.throw`）。

### Z3 `await` 一个「已经是 resolved」的原生 promise，会额外多等几个 tick？

**一句话**：**1 个微任务 tick**。

**实测**：

```js
(async () => { console.log("A"); await Promise.resolve(); console.log("B"); })();
Promise.resolve().then(() => console.log("m1")).then(() => console.log("m2")).then(() => console.log("m3"));
console.log("C");
```

输出 `A → C → B → m1 → m2 → m3`：`B` 的续体在 `await` 那一刻就排进队列，早于后面注册的 `m1`。

**加分点**：如果 `await` 的是 **thenable**（不是原生 promise，比如 `{ then(res){ res() } }`），
会多一层 `PromiseResolveThenableJob`，通常**再多 1~2 个 tick**；
`return Promise.resolve(1)` 也会多几层解包 —— 值一样，时机不同。