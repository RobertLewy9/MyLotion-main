# Day 8 · B1 轨 —— 原型链与继承（问答一体）

> **归属：Day 8 · B1 轨（前端八股）**
> 依据：腾讯云智一面「继承在 JavaScript 中是如何实现的？」；B 站一面「JS 是基于原型的语言」。
> 用法：先说属性查找，再说继承实现，最后说 `class` 与项目取舍；不扩展到 ES5 继承写法大全。

## 思维导图

```text
原型链与继承
├─ 三个术语：prototype / [[Prototype]] / constructor
├─ 查找路径：实例 → 构造函数.prototype → Object.prototype → null
├─ 继承实现：ES5 原型链 / class extends 两条链
│  ├─ Dog.prototype.__proto__ === Animal.prototype（实例方法）
│  └─ Dog.__proto__ === Animal（静态方法）
└─ 项目建模：普通对象 + 纯函数 + 组合优先
```

## Part 1 · 概念

### Q1. `prototype`、实例的 `[[Prototype]]` 和 `constructor` 各是什么？属性查找在哪里结束？

**参考答案（口述）**

原型机制主要用于让多个对象共用方法。

| 名词 | 人话理解 |
|---|---|
| `Constructor.prototype` | 构造函数提供的公共位置，存放实例可共用的方法 |
| `[[Prototype]]` | 对象内部的连接，找不到属性时沿它往上找 |
| `prototype.constructor` | 默认指回对应的构造函数 |

`[[Prototype]]` 是规范里的内部槽，不是普通属性；日常调试常见 `__proto__`，标准读取方法是 `Object.getPrototypeOf()`。

```js
function User(name) {
  this.name = name;
}
const user = new User("Ada");

Object.getPrototypeOf(user) === User.prototype; // true
User.prototype.constructor === User;            // true
```

**`new User("Ada")` 做了什么：**

1. 创建新对象；
2. 把新对象的 `[[Prototype]]` 指向 `User.prototype`；
3. 以新对象作为 `this` 执行构造函数；
4. 没有显式返回另一个对象时，返回新对象。

**属性查找路径：**

```text
user → User.prototype → Object.prototype → null
```

先找自身，找不到再沿原型链向上，直到找到或到达 `null`。

补充：箭头函数不能作为构造函数，没有 `prototype` 属性，`new arrow()` 会报错。

### Q2. JavaScript 的继承怎么实现？ES5 写法与 `class extends` 建立哪两条关系？

**参考答案（口述）**

JS 继承的本质是**原型链**。

**ES5 的核心结构：**

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function Dog(name) {
  Animal.call(this, name); // 复用父类实例属性初始化
}
Dog.prototype = Object.create(Animal.prototype); // 建立实例方法原型链
Dog.prototype.constructor = Dog;
```

关键三步：父构造函数 `call(this)` 复用实例属性；`Object.create` 建立原型链；修正 `constructor`。

**`class extends` 在现代运行时也是原型链，但建立了两条关系：**

```js
class Animal {
  speak() { return `${this.name} makes a sound`; }
  static kind() { return "animal"; }
}
class Dog extends Animal {
  constructor(name) {
    super(name); // 调用父类构造函数，使用 this 前必须调用
    this.breed = "corgi";
  }
  speak() {
    return `${super.speak()} / woof`;
  }
}
```

```js
Dog.prototype.__proto__ === Animal.prototype; // 实例方法继承
Dog.__proto__ === Animal;                     // 静态方法继承
```

`super.speak()` 调用父类方法，但 `this` 仍指向当前实例。

### Q3. 为什么实例方法通常放在 `prototype` 上？`class` 与普通构造函数还有哪些差异？

**参考答案（口述）**

属性每个实例各有一份，公共方法可以共享，所以放在 `prototype` 上节省内存。

```js
function User(name) {
  this.name = name;
}
User.prototype.sayHi = function () {
  return `hi, ${this.name}`;
};

const a = new User("A");
const b = new User("B");
a.sayHi === b.sayHi; // true
```

如果方法写在 `this` 上，每创建一个实例就会多创建一个函数。

**`class` 与普通构造函数的语义差异：**

- `class` 不能脱离 `new` 调用；
- 类体默认是严格模式；
- 原型方法是不可枚举的；
- 类声明存在 TDZ，必须先声明再使用；
- `extends` 还会建立静态方法继承链。

## Part 2 · 典例推演

### Q. 逐行判断输出，并说明每一行查到了哪条原型链

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
  static kind() { return "animal"; }
}

class Dog extends Animal {
  constructor(name) {
    super(name);
    this.breed = "corgi";
  }
  speak() { return `${super.speak()} / woof`; }
}

const d = new Dog("Ada");

console.log(d.speak());
console.log(Object.getPrototypeOf(d) === Dog.prototype);
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype);
console.log(Object.getPrototypeOf(Dog) === Animal);
console.log(Dog.kind());
console.log(d instanceof Dog, d instanceof Animal);
console.log(Object.hasOwn(d, "speak"), Object.hasOwn(Dog.prototype, "speak"));
```

**答案：**

```text
Ada makes a sound / woof
true
true
true
animal
true true
false true
```

**解释：**

- `d.speak()` 沿 `d → Dog.prototype → Animal.prototype` 查找；`super.speak()` 里的 `this` 仍是 `d`。
- `Object.getPrototypeOf(Dog) === Animal` 说明静态方法也能继承。
- `instanceof` 检查构造函数的 `prototype` 是否在实例的原型链上。
- `speak` 在 `Dog.prototype` 上，不在实例自身，所以 `Object.hasOwn(d, "speak")` 为 `false`。

## Part 3 · 项目落地

### Q. MyLotion 为什么不用文档类继承？TS 的 `interface extends` 是一回事吗？多种文档类型怎么建模？

**参考答案（口述）**

**① 为什么不用类继承：**

文档来自数据库，主要是普通对象：

```ts
interface DocumentRow {
  id: string;
  parentDocument: string | null;
  title: string;
}
```

项目采用：

```text
DocumentRow（普通数据）
  + buildTree / collectSubtreeIds（纯函数）
  + Map 索引（辅助查询）
```

原因：数据库返回普通对象，直接使用更方便；文件夹和文件有很多共同操作，不必设计继承类；组合更灵活，避免继承层次越来越复杂。

**② `interface extends` 不是原型继承：**

```ts
interface SidebarDocument {
  id: string;
  parentDocument: string | null;
}
interface TreeNode extends SidebarDocument {
  children: TreeNode[];
}
```

这里只是类型扩展，让 `TreeNode` 拥有父接口字段约束。编译成 JS 后 interface 消失，不会建立运行时原型链。

**③ 多种文档类型：**

优先使用组合和判别联合，而不是多层类继承：

```ts
type Document =
  | { kind: "page"; content: unknown }
  | { kind: "database"; schema: unknown }
  | { kind: "canvas"; scene: unknown };
```

通过 `kind` 区分类型，再用 `switch` 处理不同逻辑。

**核心思想：优先组合（has-a），谨慎继承（is-a）。**

## 30 秒复盘

构造函数通过 `prototype` 提供共享方法，实例通过 `[[Prototype]]` 指向它，属性查找沿原型链直到 `null`。JS 继承的本质是原型链；`class extends` 建立实例方法链和静态方法链，`super` 负责调用父类构造和父类方法。MyLotion 使用普通对象、纯函数和组合；TS `interface extends` 只做类型约束，不产生运行时原型链。

## 自测清单

- [ ] 能解释 `prototype`、`[[Prototype]]`、`constructor`。
- [ ] 能说出 `new` 的四步和属性查找路径。
- [ ] 能讲清 ES5 原型继承与 `class extends` 的两条链。
- [ ] 能说明公共方法为什么放 `prototype`。
- [ ] 能解释 MyLotion 为什么优先组合，以及 `interface extends` 的局限。
