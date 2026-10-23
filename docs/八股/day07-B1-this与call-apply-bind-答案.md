# Day 7 · B1 答案 —— `this` 指向 + `call` / `apply` / `bind`（口述版）

> **归属：Day 7 · B1 轨（前端八股）**
> 答法统一：**一句话结论 → 展开为什么 → 落回项目**。

## Part 1 · 概念

### 1. `this` 的四条绑定规则？优先级怎么排？

**一句话**：**`new` > 显式（call/apply/bind）> 隐式（obj.fn）> 默认（独立调用）**。

**展开**：
1. **默认绑定**：`fn()` 独立调用。非严格模式 `this` 是 `globalThis`；**严格模式是 `undefined`**；
2. **隐式绑定**：`obj.fn()`，`this` 是 `obj`。注意「谁调用」看的是**调用点左边那个对象**，
   不是函数定义在哪；赋值给变量后 `const f = obj.fn; f()` 就退回默认绑定；
3. **显式绑定**：`fn.call(ctx)` / `fn.apply(ctx)` / `fn.bind(ctx)`，`this` 被指定；
4. **`new` 绑定**：`new Fn()` 创建新对象，`this` 指向它。

**优先级**：`new` 最高；`bind` 一旦绑定就**不可再改**（`bind` 的 this 是「硬绑定」）；
显式高于隐式；隐式高于默认。

**加分**：箭头函数**不参与**这套规则 —— 它没有自己的 `this`，直接取定义时外层的。

### 2. 箭头函数为什么没有自己的 `this`？适合用在哪？

**一句话**：箭头函数没有自己的 `this` / `arguments` / `super` / `new.target`，
`this` 在**定义时**由外层词法环境决定。

**展开**：普通函数的 `this` 是**调用时**决定的（动态）；箭头函数没有 `[[ThisMode]]` 的绑定，
它在**定义时**就把外层的 `this` 捕获进来了 —— 所以 `call` / `apply` / `bind` 也改不了它。

**适合**：回调、事件处理、`map/filter` 里的短函数、React 函数组件内部 —— 不想让 `this` 漂走的地方。
**不适合**：对象的方法（`{ name, getName: () => this.name }` 拿不到对象）、需要 `arguments` 的地方、
需要 `new` 的地方（箭头函数没有 `[[Construct]]`，`new` 会直接 TypeError）。

**落回项目**：React 函数组件里所有事件处理都是箭头函数或普通函数，
它们通过**闭包**拿 props/state，不依赖 `this`，所以不存在绑定问题。

## Part 2 · 手写 `call` / `apply` / `bind`

### `myCall`

```js
Function.prototype.myCall = function (ctx, ...args) {
  if (typeof this !== "function") throw new TypeError("not callable");

  // 非严格语义：null / undefined → 全局对象；原始值装箱
  const target = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  const key = Symbol("fn"); // 用 Symbol 避免覆盖用户属性

  target[key] = this;
  const result = target[key](...args);
  delete target[key];       // 用完就删，别污染对象
  return result;
};
```

**核心思路**：把函数临时挂到目标对象上，变成 `target.fn()`，`this` 自然就是 `target`；
调用完删掉。用 `Symbol` 是为了不和对象已有属性冲突。

**严格模式的区别**：原生 `call` 在严格模式下不会把 `null` 变成 `globalThis`；
上面这版演示的是非严格语义，面试时主动说一句「严格模式要保留 null」是加分项。

### `myApply`

```js
Function.prototype.myApply = function (ctx, args = []) {
  return this.myCall(ctx, ...args);
};
```

`apply` 和 `call` 只差参数形式：一个数组 vs 展开的参数列表。

### `myBind`（支持 `new`）

```js
Function.prototype.myBind = function (ctx, ...boundArgs) {
  const fn = this;

  function boundFn(...rest) {
    const isNew = new.target !== undefined;
    // new 的时候 this 是新建的对象；否则用绑定的 ctx
    return fn.apply(isNew ? this : ctx, boundArgs.concat(rest));
  }

  // 让 new boundFn() 出来的实例 instanceof fn
  if (fn.prototype) {
    boundFn.prototype = Object.create(fn.prototype);
  }

  return boundFn;
};
```

**三个关键点**：
1. **硬绑定**：返回的 `boundFn` 里 `ctx` 已经被闭包固定，**再 `bind` 一次也改不了**；
2. **`new` 优先级更高**：`new boundFn()` 时 `this` 是新对象，不是 `ctx` —— 这就是「`new` 高于显式绑定」；
3. **原型链**：`boundFn.prototype = Object.create(fn.prototype)`，否则 `instanceof fn` 会 false。

## Part 3 · 项目落地

**类组件为什么需要 `bind`？**

```jsx
class Panel extends React.Component {
  handleClick() { this.setState({ open: true }); } // 这里的 this 必须指向组件实例
  render() { return <button onClick={this.handleClick} />; }
}
```

`onClick={this.handleClick}` 传的是**函数引用**，React 之后是**独立调用**它（相当于 `const f = this.handleClick; f()`），
走默认绑定 —— 严格模式下 `this` 是 `undefined`，于是 `this.setState` 报错。
所以要：
- 构造器里 `this.handleClick = this.handleClick.bind(this)`；
- 或者类字段箭头函数 `handleClick = () => this.setState(...)`（箭头函数捕获实例的 this）；
- 或者渲染时 `onClick={() => this.handleClick()}`（每次 render 新建函数，性能略差）。

**函数组件为什么不用？**
函数组件没有实例、没有 `this`；事件处理函数通过**闭包**捕获当前渲染的 props / state。
每次 render 都是一份新的闭包，天然对应那次渲染的数据 —— 这也是 hooks 的心智模型。

**项目里怎么避免 `this` 问题**：优先函数组件 + hooks；必须写类时用类字段箭头函数；
不要在对象方法里用箭头函数（会拿不到对象本身）。

## 追问预判

**Q1：严格模式下 `fn()` 的 `this` 是什么？**
`undefined`。非严格模式下会被替换成 `globalThis`。模块代码默认是严格模式，所以「独立调用 = undefined」。

**Q2：`f.bind(a).bind(b)` 能把 this 改成 b 吗？**
不能。第一次 `bind` 就把 `this` 硬绑定成 `a` 了，第二次 `bind` 只是又包了一层，
内层仍然是 `a`。这叫**绑定不可逆**。

**Q3：箭头函数能当构造函数吗？**
不能。它没有 `[[Construct]]` 内部方法，`new (() => {})` 会抛 `TypeError: not a constructor`。
也没有 `prototype` 属性。