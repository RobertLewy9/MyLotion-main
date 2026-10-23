# Day 7 · B1 轨题纸 —— 箭头函数与 `this`（面经校准版 · 15 分钟）

> **归属：Day 7 · B1 轨（前端八股）**
> 2026-10-23 按 8 场面经校准：CSIG 一面 Q16/Q17、腾讯云智一面都只问
> 「箭头函数和普通函数的区别」「箭头函数能不能用 call/apply/bind 改 this」。
> 8 场没有要求手写 `call`/`apply`/`bind`，所以删掉手写实现，只保留能口述的部分。

## Part 1 · 概念（每题 2 分钟）

**1.** 普通函数的 `this` 在什么时候确定？默认、隐式、显式、`new` 四种绑定分别是什么？优先级怎么排？

**2.** 箭头函数为什么没有自己的 `this`？它适合用在哪、不适合用在哪？

**3.** `fn.call(ctx)`、`fn.apply(ctx, args)`、`fn.bind(ctx)` 有什么共同点？对箭头函数为什么无效？

## Part 2 · 输出题（1 分钟）

```js
function Outer() {
  this.name = "outer";
  this.normal = function () { return this.name; };
  this.arrow = () => this.name;
}

const o = new Outer();
console.log(o.normal.call({ name: "ctx" }));
console.log(o.arrow.call({ name: "ctx" }));
```

## Part 3 · 项目落地（2 分钟）

React 类组件里为什么常见 `this.handleClick = this.handleClick.bind(this)`？
函数组件为什么没有这个问题？

> 面试只需要说清「传函数引用后独立调用，this 丢了」和「函数组件靠闭包拿 props/state」。