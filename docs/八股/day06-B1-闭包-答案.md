# Day 6 · B1 答案 —— 闭包（口述版）

> **归属：Day 6 · B1 轨（前端八股）**
> 答法统一：**一句话结论 → 展开为什么 → 落回项目**。
> 术语要用（词法作用域、可达性、GC root、部分应用），但第一次出现时用半句话解释掉。

## Part 1 · 概念（各 3 分钟）

### 1. 闭包是什么？产生的三个条件？

**一句话**：闭包是**函数 + 它定义时所在的词法环境**；函数被带到外面执行，仍然能访问那个环境里的变量。

**展开**：关键在「**词法作用域在定义时确定，不是调用时确定**」。
所以内层函数不管在哪里被调用，它查变量都回自己定义的那一层去找。

**三个条件**：
1. 有函数嵌套（内层函数）；
2. 内层函数**引用了外层函数的变量**；
3. 内层函数被**带出外层作用域**（被返回、赋给外部变量、注册成回调）。

```js
function counter() {
  let n = 0;              // 外层变量
  return function () {    // 内层函数
    return ++n;           // 引用外层变量
  };                      // 被返回 → 带出作用域
}
const next = counter();
next(); // 1
next(); // 2
```

**加分点**：严格说，函数一创建就带着词法环境；面试里强调「被带出」是为了解释**为什么它能在外面还记得**。

### 2. 闭包会造成内存泄漏吗？什么情况下才是真的泄漏？

**一句话**：闭包本身不会必然造成内存泄漏。闭包会让函数继续访问它所需要的外部变量，只要这个函数仍然可达，相关变量就可能需要继续保留。

真正需要关注的是：某些对象已经没有业务上的使用价值，却因为仍然存在可达引用而无法被垃圾回收，导致内存持续占用甚至不断增长。

例如：
```js
function createHandler() {
  const largeData = new Array(1000000).fill("data");

  return function handler() {
    console.log(largeData.length);
  };
}

const handler = createHandler();
```
只要 handler 仍然可达，而且它需要访问 largeData，相关数据就可能继续保留。
如果后续不再需要这个处理函数，就应当解除不必要的引用：
```js
handler = null;
```

1. **定时器没清**：`setInterval` 的回调是闭包，闭包里引用了大对象，`clearInterval` 不调用就一直活着；
2. **事件监听没移除**：组件卸载了，监听器还挂在 `window` / `document` 上；
3. **游离 DOM**：闭包里存了已经 removed 的 DOM 节点，节点和它的子树都回收不了；
4. **无上限缓存 / 全局数组**：缓存 key 无限增长，每个 value 又是闭包。

**判断方法**：问自己两句 ——「这个闭包还能被谁访问？」「它引用的东西现在还需要吗？」
四种情况对比
情况	        谁一直持有引用？	                应该怎么处理？
定时器没清	   定时器系统持有回调	               clearInterval / clearTimeout
监听器没移除	 window / document               持有回调	removeEventListener
游离 DOM	    JS 变量或闭包持有 DOM	            解除不需要的引用
无上限缓存	   全局数组或 Map 持有函数和数据	    清理、限容、设置淘汰策略

**反例**：每次调用都创建一个闭包，不等于泄漏 —— 只要它执行完就不可达，GC 会收走。

### 3. 闭包和柯里化是什么关系？柯里化解决什么问题？

**一句话**：**柯里化是闭包的一种用法** —— 用闭包把参数「攒」起来，等够了再执行。

**展开**：`f(a, b, c)` 变成 `f(a)(b)(c)`；每一次调用都返回一个新函数，新函数通过闭包记住了之前传过的参数。

**解决四个问题**：
1. **参数复用**：`const add10 = add(10)`，之后只用传第二个参数；
2. **延迟执行**：参数没凑齐就不执行，适合「先配置、后触发」；
3. **函数组合**：`compose(f, g)` 这类工具天然依赖「一次一个参数」；
4. **可测试 / 可配置**：把依赖提前固定，测试时只传变化的部分。

**术语区分（加分）**：
- **柯里化（currying）**：严格「一次一个参数」，`f(a)(b)(c)`；
- **部分应用（partial application）**：一次可以传多个，`f(a, b)(c)`；
- 我下面写的实现两者都支持，社区里（比如 lodash 的 `curry`）也常这么叫。

## Part 2 · 手写 `curry`（参考实现）

```ts
type AnyFn = (...args: any[]) => any;

function curry(fn: AnyFn) {
  return function curried(this: unknown, ...args: any[]) {
    // 参数够了：立刻执行
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 不够：返回一个新函数，继续攒参数
    // 注意：这里必须记住「第一次调用时的 this」——
    // 否则 c(1)(2) 的第二次是普通函数调用，this 已经丢了
    const boundThis = this;
    return function (...rest: any[]) {
      return curried.apply(boundThis, args.concat(rest));
    };
  };
}
```
验证：

```js
const add = (a, b, c) => a + b + c;
const c = curry(add);
c(1)(2)(3);   // 6
c(1, 2)(3);   // 6
c(1)(2, 3);   // 6
c(1, 2, 3);   // 6
```

**四个必须说清的细节**：

1. **为什么用 `fn.length`**：它返回「第一个默认参数之前」的形参个数，正好是「凑齐才能执行」的阈值；
2. **默认参数 / rest 参数的坑**：`function f(a, b = 1) {}` 的 `length` 是 1，`f(a, b, ...rest)` 的 `length` 也只数到 rest 之前 —— 这种函数用 `length` 判断会提前执行，要额外约定；
3. **`this` 的坑**：`c(1)(2)` 的第二次调用是普通函数调用，`this` 会丢 —— 所以上面用 `boundThis` 记住第一次的 this；
   不过柯里化通常配合**纯函数**使用，能不用 `this` 就不用；
4. **和 `bind` 的关系**：`fn.bind(null, 1)` 也是「固定参数」，但它**固定 this + 一次给完**，不会根据参数个数自动继续；
   柯里化是「按 arity 自动累积」，两者解决的问题重叠但不相同。

## Part 3 · 项目落地（三个都给了，面试挑一个讲）

### A. `createNote` 里的 `createdNoteId`

**① 在我项目里干什么**：防止模型在同一轮对话里重复创建草稿。

**② 完整流程**：工具实例是**按请求创建**的，`createNote` 外层用闭包维护一个 `createdNoteId`；
第一次调用真正建库并把 id 存进去，之后再被调用就直接返回同一个 id（或提示「本轮已创建」）。
提示词里再软约束一句「每轮最多建一篇」，两道保险。

**③ 为什么不用全局变量**：全局变量会跨请求、跨用户串；闭包跟着工具实例走，
**请求结束、实例不可达，状态自然回收** —— 隔离是「创建位置」给的，不是靠手动清理。

### B. `pendingById` 请求去重

**① 在我项目里干什么**：同一篇文档被并发请求时，只发一次网络请求。

**② 完整流程**：模块级 `Map<documentId, Promise>`；`getById` 进来先查 Map，
命中就直接返回同一个 promise（所有调用方共享结果）；没命中就发请求，把 promise 存进去，
`finally` 里删掉。再叠一层 LRU 上限 200 的内存缓存，命中缓存就不发请求。

**③ 为什么用闭包 / Map 而不是每个组件各自存**：去重是**跨组件共享**的需求，
状态必须放在比组件更长的生命周期里；但 key 用文档 id（全局唯一），所以不会跨用户串。

### C. `debounce` 的 `timer`

**① 在我项目里干什么**：编辑器 `onChange` 触发很频繁，防抖后再保存。

**② 完整流程**：`debounce(fn, 300)` 返回的函数通过闭包持有 `timer`；
每次调用先 `clearTimeout(timer)`，再 `setTimeout`；只有停止输入 300ms 才真正执行保存。
组件卸载时调用 `cancel()` 清掉 timer。

**③ 为什么用闭包**：`timer` 是「这个防抖函数私有」的状态，外部不该看见也不该改；
放全局会互相覆盖，放类字段又要额外管理实例。

## 追问预判

**Q1：闭包里的状态什么时候被回收？**
当**闭包本身不可达**时，它和它捕获的变量一起被回收。挂在定时器、事件监听、全局缓存上的闭包，
要等那些引用被清掉才回收 —— 所以「谁还引用着它」才是判断标准。

**Q2：多用户并发会不会串？**
看闭包在哪里创建。**按请求创建**（每个 handler 一次）就天然隔离；
**模块级单例**就会串。所以 `createdNoteId` 放在按请求创建的工具实例里是安全的，保存的是“当前这轮对话创建了哪篇笔记”，不同请求应该有不同的值；
```js
// 模块加载时创建一次，后续请求共享它
let createdNoteId = null;

function createNote(id) {
  if (createdNoteId) {
    return createdNoteId;
  }

  createdNoteId = id;
  return id;
}
假设用户 A 先调用：
createNote("A的笔记");
此时 createdNoteId 变成 "A的笔记"。
用户 B 再调用：
createNote("B的笔记");
结果却返回 "A的笔记"，因为这个变量已经有值了！
```

`pendingById` 是模块级,保存的是“某篇文档当前有没有正在执行的请求”，但 key 是全局唯一的文档 id，也安全。要是 key 换成 `userId` 就要格外小心。
```js
const pendingById = new Map();
function getById(id) {
  if (pendingById.has(id)) {
    return pendingById.get(id);
  }
  const promise = fetchDocument(id).finally(() => {
    pendingById.delete(id);
  });
  pendingById.set(id, promise);
  return promise;
}
```


**Q3：循环里 `var` 和 `let` 的经典题？**
`var` 是函数作用域，循环里只有一个变量，所有回调共享它，最后都拿到最终值；
`let` 是块级作用域，let 在 for 循环中会为每轮迭代提供独立的绑定，所以每个回调都能读取自己那轮的 i。
用 `var` 时想隔离，就得用 IIFE 手动造一个闭包。
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
```



**Q4：闭包捕获的是「值」还是「变量」？**
捕获的是**变量（绑定）**，不是创建时的快照。所以闭包能看到这个变量之后的变化 ——
这也是 `var` 循环题会全部输出同一个值的原因。
```js
function outer() {
  let count = 0;

  return function inner() {
    console.log(count);
  };
}
const fn = outer();
fn(); // 0
// 修改闭包访问的同一个变量
// 假设修改操作也发生在 outer 的作用域内
```

最后，面试时可以把 Q2 和 Q4 串起来回答：
闭包能够让函数在外层函数执行完之后，继续访问外层作用域中的变量。但是否会发生多用户数据串扰，取决于闭包对应的状态实例是否被多个请求共享。如果每个请求独立创建工具实例，状态通常是隔离的；如果状态放在模块级单例中，多个请求就可能共享它。模块级状态也不是一定错误，比如请求去重就可能需要共享 Promise，但必须正确设计 key、权限和生命周期。