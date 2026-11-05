# Day 7 · B1 轨 —— 箭头函数与 `this`（问答一体）

> **归属：Day 7 · B1 轨（前端八股）**
> 依据：CSIG 一面、腾讯云智一面问过“箭头函数与普通函数的区别”“箭头函数能否用 `call/apply/bind` 改 `this`”。
> 用法：先按优先级判断 `this`，再用一句话解释箭头函数；不要求手写 polyfill。

## 思维导图

```text
this
├─ 默认绑定：fn() → undefined（严格）/ 全局对象（非严格）
├─ 隐式绑定：obj.fn() → obj
├─ 显式绑定：call / apply / bind
├─ new 绑定：新创建的实例
└─ 优先级：new > 显式 > 隐式 > 默认
```

## Part 1 · 概念

### Q1. 普通函数的 `this` 什么时候确定？四种绑定和优先级是什么？

**参考答案（口述）**

普通函数的 `this` 看**这次怎样调用**，不是看函数定义在哪里。

| 绑定方式 | 例子 | `this` 指向 |
|---|---|---|
| 默认绑定 | `fn()` | 严格模式 `undefined`；非严格模式全局对象 |
| 隐式绑定 | `obj.fn()` | `obj` |
| 显式绑定 | `fn.call(ctx)` / `apply` / `bind` | 指定对象 |
| `new` 绑定 | `new Fn()` | 本次创建的实例 |

```js
function User(name) { this.name = name; }
const user = new User("Ada"); // this 指向新实例

const account = {
  name: "ctx",
  getName() { return this.name; }
};
account.getName(); // "ctx"：隐式绑定

function showThis() { "use strict"; return this; }
showThis.call({ name: "ctx" }); // 显式绑定
const detached = account.getName;
detached(); // undefined：默认绑定，调用处没有 account.
```

**优先级：** `new > 显式绑定 > 对象方法调用 > 默认绑定`。

对可构造的绑定函数使用 `new` 时，构造函数里的 `this` 指向本次新对象，忽略 `bind` 指定的对象。

### Q2. 箭头函数为什么没有自己的 `this`？适合和不适合用在哪？

**参考答案（口述）**

箭头函数没有自己的 `this`，会沿用**定义它时外层**的 `this`。

- 适合：需要保留外层 `this` 的回调。
- 不适合：需要随调用对象变化的方法、构造器、需要自己的 `arguments` 的场景。

```js
function makeReader() {
  return () => this.name;
}
const read = makeReader.call({ name: "outer" });
read.call({ name: "other" }); // "outer"：call 改不了箭头函数的 this
```

箭头函数还没有自己的 `arguments`，需要收参数时用 `...args`；它也不能作为构造函数，`new arrow()` 会报错。

### Q3. `call`、`apply`、`bind` 有什么共同点？为什么对箭头函数无效？

**参考答案（口述）**

三者都能为**普通函数**指定 `this`：

- `call(ctx, a, b)`：立即调用，参数逐个传；
- `apply(ctx, [a, b])`：立即调用，参数用数组传；
- `bind(ctx, a)`：不立即执行，返回一个绑定 `this` 的新函数，还可以预填参数。

```js
function sum(a, b) { return this.base + a + b; }
const ctx = { base: 10 };
sum.call(ctx, 1, 2);    // 13
sum.apply(ctx, [1, 2]); // 13

const add = sum.bind({ base: 10 }, 1);
add(2); // 13
add.call({ base: 100 }, 2); // 13：this 仍由 bind 固定
```

箭头函数没有自己的 `this`，它从词法环境读取外层 `this`，所以 `call/apply/bind` 无法替它更换 `this`。

## Part 2 · 典例推演

### Q. 逐行判断输出，并说明每行的 `this` 来自哪里

```js
function Outer() {
  this.name = "outer";
  this.normal = function () { return this.name; };
  this.arrow = () => this.name;
}

const o = new Outer();
console.log(o.normal.call({ name: "ctx" }));
console.log(o.arrow.call({ name: "ctx" }));

const detached = o.normal;
console.log(detached.call({ name: "detached" }));

const bound = o.normal.bind({ name: "bound" });
console.log(bound.call({ name: "call" }));
```

**答案：**

```text
ctx
outer
detached
bound
```

- `o.normal.call(...)`：普通函数，`call` 指定的对象生效。
- `o.arrow.call(...)`：箭头函数沿用 `new Outer()` 时的实例 `o`，输出 `outer`。
- `detached.call(...)`：普通函数，`call` 指向新对象。
- `bound.call(...)`：`bind` 已固定 `this`，后续 `call` 不能覆盖。

## Part 3 · 项目落地

### Q. React 类组件为什么常见 `bind(this)`？函数组件为什么没有这个问题？

**参考答案（口述）**

类组件里 `onClick={this.handleClick}` 传过去的是函数引用。React 调用回调时不会自动绑定组件实例，直接调用会丢掉 `this`。

```jsx
class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() { this.setState({ open: true }); }
}
```

也可以在类中定义箭头函数，沿用实例的 `this`：

```jsx
handleClick = () => this.setState({ open: true });
```

函数组件不靠 `this` 访问状态。事件处理函数通过闭包读取创建它的那次渲染中的 props 和 state，所以不需要 `bind`。

```jsx
function Panel() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>{open ? "收起" : "打开"}</button>;
}
```

## 30 秒复盘

普通函数的 `this` 由调用方式决定，优先级是 `new > 显式绑定 > 隐式绑定 > 默认绑定`。箭头函数没有自己的 `this`、`arguments` 和构造能力，`call/apply/bind` 只能传参，不能更换它的 `this`。`call/apply` 立即调用，`bind` 返回新函数。React 类组件通过 `bind` 或类字段箭头函数保留实例，函数组件靠闭包读取本次渲染的 props/state。

## 自测清单

- [ ] 能按优先级判断四种 `this` 绑定。
- [ ] 能解释箭头函数的 `this`、`arguments` 和构造限制。
- [ ] 能区分 `call`、`apply`、`bind` 的调用时机与传参方式。
- [ ] 能讲清 React 类组件与函数组件的差异。
