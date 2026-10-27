# Day 7 · B1 轨答案 —— 箭头函数与 `this`（面经校准版）

> **归属：Day 7 · B1 轨（前端八股）**
> 依据：CSIG 一面「箭头函数和普通 function 的区别」「箭头函数能不能 call/apply/bind 改 this」；
> 腾讯云智一面「箭头函数的 this 指向」。不要求手写 polyfill。

## 1. 普通函数的 this

普通函数的 `this` 在**调用时**确定，常见四条规则，优先级从高到低：

1. `new Fn()`：`this` 是新创建的实例；
2. 显式绑定：`fn.call(ctx)` / `fn.apply(ctx)` / `fn.bind(ctx)`；
3. 隐式绑定：`obj.fn()`，`this` 是 `obj`；
4. 默认绑定：单独调用 `fn()`，非严格模式是全局对象，严格模式是 `undefined`。

一个常见坑：`const f = obj.fn; f()` 已经不是 `obj.fn()`，会退回默认绑定。

### 典例：盯住调用点

```js
const user = {
  name: "小明",
  getName() { return this.name; }
};

console.log(user.getName()); // 小明：点号左边是 user，隐式绑定

const getName = user.getName;
console.log(getName.call({ name: "小王" })); // 小王：call 显式指定 this

const fixedName = getName.bind({ name: "小李" });
console.log(fixedName.call({ name: "小周" })); // 小李：bind 固定的 this 不被后续 call 覆盖
```

`new` 的优先级更高：

```js
function User(name) { this.name = name; }
const BoundUser = User.bind({ name: "这个对象会被忽略" });
console.log(new BoundUser("Ada").name); // Ada：作为构造函数调用时，this 是新实例
```

记忆顺序：**先看 `new`，再看显式绑定，再看点号左边，最后看默认绑定。**

## 2. 箭头函数的 this

箭头函数没有自己的 `this`，它在**定义时**采用外层词法环境的 `this`。也没有自己的 `arguments`，
不能作为构造函数，不能 `new`。

**适合**：回调、`map/filter`、React 函数组件内部的事件处理。
**不适合**：对象方法、需要动态 `this` 的地方、需要 `new` 的地方。

看这个例子：箭头函数在 `panel.makeReader()` 里面定义，拿到的是那次调用中 `makeReader` 的 `this`，也就是 `panel`。之后用 `call` 也改不了它。

```js
const panel = {
  name: "panel",
  makeReader() {
    return () => this.name;
  }
};

const readName = panel.makeReader();
console.log(readName.call({ name: "other" })); // panel
```

## 3. call / apply / bind

- `call`：立即调用，参数逐个传；
- `apply`：立即调用，参数放数组；
- `bind`：返回一个绑定了 `this` 和部分参数的新函数，不立即调用。

```js
function greet(prefix, suffix) { return `${prefix}，${this.name}${suffix}`; }
const ctx = { name: "小明" };

greet.call(ctx, "你好", "！");       // 立即调用，参数逐个传
greet.apply(ctx, ["早上好", "！"]); // 立即调用，参数放数组
const sayHi = greet.bind(ctx, "你好");
sayHi("！");                         // 之后调用，前缀已预先绑定
```

它们都只能改变**普通函数调用时的 this**。箭头函数的 `this` 在定义时已经固定，所以三种方法都改不了它。

## Part 2 · 输出题

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

输出：

```text
ctx
outer
detached
bound
```

`o.normal.call({ name: "ctx" })` 用显式绑定，`this` 是传入的对象；
`o.arrow.call(...)` 不能改变箭头函数的 `this`，它仍然取构造时的 `o`，所以是 `outer`。
后两行分别演示普通函数脱离对象后由 `call` 指定 `this`，以及 `bind` 固定的 `this` 不会被后续 `call` 覆盖。

## Part 3 · 项目落地

类组件：

```jsx
class Panel extends React.Component {
  handleClick() { this.setState({ open: true }); }
  render() { return <button onClick={this.handleClick} />; }
}
```

`this.handleClick` 传给 React 后，回调是**脱离对象单独调用**的；严格模式下 `this` 是 `undefined`，再调 `this.setState` 就报错。
常见修法有构造器里 `bind(this)`，或用类字段箭头函数：

```jsx
class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() { this.setState({ open: true }); }
}

// 或者：handleClick = () => { this.setState({ open: true }); }
```

函数组件没有实例、没有 `this`，事件处理函数通过闭包拿到当前渲染的 props/state，所以不需要 bind：

```jsx
function Panel() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(true)}>打开</button>;
}
```

## 及格线

能讲清「箭头函数没有自己的 this」「call/apply/bind 改不了箭头函数」「类组件为什么要 bind」。
面试官没有要求手写 polyfill，不要把这 15 分钟花在 `myBind` 的 `new` 和原型链上。
