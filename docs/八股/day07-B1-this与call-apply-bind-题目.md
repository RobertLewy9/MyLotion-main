# Day 7 · B1 题纸 —— `this` 指向 + `call` / `apply` / `bind`（轻量版 · 25 分钟）

> **归属：Day 7 · B1 轨（前端八股）**
> 2 概念 + 1 手写 + 1 项目落地。合上资料、计时 25 分钟、**开口讲**。

## Part 1 · 概念（各 4 分钟）

**1.** `this` 的四条绑定规则分别是什么？优先级怎么排？
> 提示：默认 / 隐式 / 显式 / `new`；再说清严格模式下默认绑定是什么。

**2.** 箭头函数为什么没有自己的 `this`？它适合用在哪、不适合用在哪？
> 提示：它没有 `[[Construct]]`，所以不能 `new`；`this` 取的是定义时外层。

## Part 2 · 手写（10 分钟）

**3.** 手写 `call` / `apply` / `bind`：

```js
fn.myCall(ctx, 1, 2);
fn.myApply(ctx, [1, 2]);
const bound = fn.myBind(ctx, 1);
bound(2);
```

- `bind` 要支持 `new bound()`（加分项：`new` 出来的实例 `instanceof fn` 为 true）
- 加分：说清 `bind` 之后还能不能改 `this`

## Part 3 · 项目落地（5 分钟）

**4.** 类组件为什么需要 `bind`，函数组件为什么不用？项目里怎么避免 `this` 问题？
> 提示：`onClick={this.handleClick}` 传的是函数引用，调用时 `this` 是什么？

## 追问预判

- 严格模式下 `fn()` 的 `this` 是什么？非严格模式呢？
- `f.bind(a).bind(b)` 能把 `this` 改成 `b` 吗？
- 箭头函数能不能当构造函数？为什么？