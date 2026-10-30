# Day 7 · B1 轨答案 —— 箭头函数与 `this`（面经校准版）

> **归属：Day 7 · B1 轨（前端八股）**
> 依据：CSIG 一面、腾讯云智一面。按原题纸顺序作答；每个知识点后紧跟一个小例子。

## Part 1 · 概念（每题 2 分钟）

### 1. 普通函数的 this 与绑定优先级

普通函数的 `this` 要看**这次怎样调用**，同一个函数换一种调用方式，`this` 就可能改变。

#### new：创建对象，并用构造函数初始化

**口述：**`new User("Ada")` 创建的对象，叫作 `User` 的实例。执行构造函数时，`this` 指向这个对象；执行结束后，变量 `user` 也指向它。**这里的“新对象”和“新实例”指同一个对象。**

```js
function User(name) {
  this.name = name; // this 指向本次 new 创建的对象，给它添加 name 属性
}
const user = new User("Ada"); // user 指向这个对象，它就是 User 的实例
console.log(user.name); // Ada
```

#### 隐式绑定：通过对象调用

**口述：**写成 `obj.fn()` 时，`this` 是调用这个方法的对象 `obj`。要看调用处，不能只看函数定义在哪。

```js
const user = {
  name: "Ada",
  getName() { return this.name; }
};
console.log(user.getName()); // Ada：this 是 user
```

#### 显式绑定：主动指定 this

**口述：**用 `call/apply/bind` 可以主动指定普通函数的 `this`，不用依赖对象方法的调用形式。三者的执行时机和传参区别见第 3 题。

```js
function getName() { return this.name; }
console.log(getName.call({ name: "Ada" })); // Ada：this 由 call 指定
```

#### 默认绑定：直接调用或取出方法后调用

**口述：**单独调用 `fn()` 时，严格模式下 `this` 是 `undefined`，非严格模式下是全局对象。把方法赋给变量，只取出了函数，不会把原对象一起绑定过去。

```js
function showThis() {
  "use strict";
  return this;
}
const obj = { showThis };
const fn = obj.showThis;
console.log(fn()); // undefined：调用处没有 obj.
```

#### 绑定优先级

**口述：**对普通函数，按 `new > 显式绑定（call/apply/bind）> 对象方法调用 > 默认绑定` 判断。对可构造的绑定函数使用 `new`，构造函数里的 `this` 指向本次 `new` 创建的对象，忽略 `bind` 指定的对象。

```js
function User(name) { this.name = name; }
const ctx = { name: "old" };       // 已有对象，原本想通过 bind 把它作为 this
const BoundUser = User.bind(ctx);  // bind 返回的新函数，不是实例
const user = new BoundUser("Ada"); // new 创建另一个对象；User 执行时 this 指向它
console.log(user === ctx);         // false：user 和 ctx 指向两个不同的对象
console.log(user.name, ctx.name);  // Ada old：属性写到 user 指向的对象上
```

### 2. 箭头函数与普通函数的区别

#### this 的来源与使用场景

**口述：**箭头函数没有自己的 `this`，会沿用定义它时外层的 `this`。适合需要保留外层 `this` 的回调；需要随调用对象改变 `this` 的方法，用普通函数。`call/apply/bind` 仍能传参，但不能替箭头函数更换 `this`。

```js
function makeReader() {
  return () => this.name;
}
const read = makeReader.call({ name: "outer" });
console.log(read.call({ name: "other" })); // outer：沿用 makeReader 的 this
```

#### arguments 与剩余参数

**口述：**箭头函数没有自己的 `arguments`，用到它时会从外层普通函数中获取。想拿到箭头函数自己收到的参数，用 `...args`。

```js
function outer() {
  return (...args) => [arguments[0], args[0]];
}
console.log(outer("外层")("箭头")); // ["外层", "箭头"]
```

#### 能否作为构造函数

**口述：**箭头函数不支持构造调用，用 `new` 会报错。需要创建实例时，用普通函数或 `class`。

```js
const User = (name) => ({ name });
new User("Ada"); // TypeError：User 不是构造函数
```

### 3. call / apply / bind

**共同点：**都可以指定普通函数的 `this`。箭头函数沿用外层 `this`，所以三者不能更换它的 `this`（见第 2 题典例）。

#### call / apply：指定 this，立即调用

**口述：**两者都会立即调用函数，第一个参数都是要使用的 `this`。`call` 把函数参数逐个传入；`apply` 用数组传入。

```js
function sum(a, b) { return this.base + a + b; }
const ctx = { base: 10 };
console.log(sum.call(ctx, 1, 2));    // 13
console.log(sum.apply(ctx, [1, 2])); // 13
```

#### bind：返回新函数，留待以后调用

**口述：**`bind` 不会立即执行函数，而是返回一个绑定了 `this` 的新函数，也可以预先填入部分参数。后续用 `call` 或再次 `bind`，都不能替换已经绑定的 `this`。

```js
function sum(a, b) { return this.base + a + b; }
const add = sum.bind({ base: 10 }, 1);
console.log(add(2));                    // 13：a 已经填入 1
console.log(add.call({ base: 100 }, 2)); // 13：this 仍是原来绑定的对象
```

## Part 2 · 典例推演（2 分钟）

```text
ctx
outer
detached
bound
```

- `o.normal.call(...)`：普通函数使用 `call` 传入的对象，输出 `ctx`。
- `o.arrow.call(...)`：箭头函数沿用 `new Outer()` 时的实例 `o`，输出 `outer`。
- `detached.call(...)`：取出的是普通函数，`call` 把 `this` 指向新传入的对象，输出 `detached`。
- `bound.call(...)`：`bind` 固定的 `this` 不被后续 `call` 覆盖，输出 `bound`。

## Part 3 · 项目落地（2 分钟）

### 类组件：保留事件回调的 this

**口述：**`onClick={this.handleClick}` 传过去的是函数，React 调用回调时不会自动绑定组件实例。可以在构造器里 `bind(this)`，或用类字段箭头函数沿用当前实例的 `this`。

构造器绑定：

```jsx
class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() { this.setState({ open: true }); }
}
```

或者删去上面的构造器和普通方法，在类中定义箭头函数：

```jsx
handleClick = () => this.setState({ open: true });
```

### 函数组件：通过闭包读取状态

**口述：**函数组件不靠 `this` 访问状态。事件处理函数通过闭包，读取创建它的那次渲染中的 props 和 state，所以不需要 `bind`。

```jsx
function Panel() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>{open ? "收起" : "打开"}</button>;
}
```
