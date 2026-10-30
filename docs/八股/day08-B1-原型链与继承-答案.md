# Day 8 · B1 轨答案 —— 原型链与继承（面经校准版）

> **归属：Day 8 · B1 轨（前端八股）**
> 依据：腾讯云智一面「继承在 JavaScript 中是如何实现的？」；B 站一面「JS 是基于原型的语言」。
> 回答顺序：先说属性查找，再说继承实现，最后说 `class` 与项目取舍。

## Part 1 · 概念

### 1. `prototype`、`[[Prototype]]`、`constructor`

**一句话：**每个对象都有一条指向另一个对象的内部链接 `[[Prototype]]`，属性找不到时就沿这条链接继续找，
一直找到 `null`；函数额外有一个 `.prototype` 属性，用来当它创建出来的实例的原型。

| 名词 | 挂在哪 | 是什么 |
|------|--------|--------|
| `Constructor.prototype` | 函数对象上 | 一个普通对象，`new` 创建实例时，实例的 `[[Prototype]]` 指向它 |
| 实例的 `[[Prototype]]` | 每个对象内部 | 原型链的下一跳；可用 `Object.getPrototypeOf(obj)` 读取 |
| `prototype.constructor` | 构造函数的原型对象上 | 默认指回构造函数，方便从实例找到“谁创建了我” |

```js
function User(name) {
  this.name = name;
}

const user = new User("Ada");

Object.getPrototypeOf(user) === User.prototype; // true
User.prototype.constructor === User;            // true
user.constructor === User;                      // true（沿原型链读取）
```

`new User("Ada")` 可以拆成四步：

1. 创建一个新对象；
2. 把这个对象的 `[[Prototype]]` 链到 `User.prototype`；
3. 以这个对象为 `this` 执行 `User`；
4. 构造函数没有返回另一个对象时，返回新对象。

访问 `user.name` 时，先查实例自身；没有就查 `User.prototype`，再查 `Object.prototype`，最后到 `null`。
这就是**原型链查找**。CSIG 上一题说箭头函数没有 `prototype`，原因也在这里：它不是普通构造函数，不能承担 `new` 的实例原型。

### 2. JavaScript 的继承怎么实现

**一句话：**JS 没有传统类继承，所谓继承就是把子构造函数的 `prototype` 挂到父构造函数的原型链上；
`class extends` 只是把这套关系写得更清楚，并在语言层面补齐了构造、`super` 和静态方法继承。

#### ES5：构造函数 + 原型链

```js
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function Dog(name) {
  Animal.call(this, name); // 借用父构造函数，初始化实例自己的属性
  this.breed = "corgi";
}

// 实例方法继承：Dog.prototype 的原型指向 Animal.prototype
Dog.prototype = Object.create(Animal.prototype);

// 修回 constructor，否则 d.constructor 会读到 Animal
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function () {
  return `${Animal.prototype.speak.call(this)} / woof`;
};

const d = new Dog("Ada");
console.log(d.speak());       // Ada makes a sound / woof
console.log(d instanceof Dog);    // true
console.log(d instanceof Animal); // true
```

三个关键动作：

- `Animal.call(this, name)`：继承**实例属性**；
- `Object.create(Animal.prototype)`：继承**原型方法**；
- `Dog.prototype.constructor = Dog`：修正构造函数指针。

不要在 ES5 里写 `Dog.prototype = new Animal()`。它会执行一次父构造函数，可能给原型塞进无意义的实例状态，
还会把参数问题混进原型。`Object.create` 只建立链接，不执行父构造函数。

#### ES6：`class extends` 建立的两条链

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
  static kind() {
    return "animal";
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name); // 调父构造函数；在它之前不能访问 this
    this.breed = "corgi";
  }
  speak() {
    return `${super.speak()} / woof`;
  }
}
```

`extends` 同时做了两件事：

```js
Dog.prototype.__proto__ === Animal.prototype; // 实例方法沿这条链找
Dog.__proto__ === Animal;                     // 静态方法沿这条链找
```

所以：

- `d.speak()`：先找 `Dog.prototype.speak`；里面的 `super.speak()` 再沿 `Dog.prototype.[[Prototype]]` 找到 `Animal.prototype.speak`；
- `Dog.kind()`：先找 `Dog` 自身，没有就沿 `Dog.[[Prototype]]` 找到 `Animal.kind`；
- `super.speak()` 不是“调用父类的某个副本”，它用当前实例作为 `this`，只是把方法查找的起点移到父原型。

### 3. 方法为什么放 `prototype`

实例状态应该每个对象一份，方法则应该大家共享。

```js
function User(name) {
  this.name = name; // 每个实例独有
}

User.prototype.sayHi = function () {
  return `hi, ${this.name}`; // 所有实例共享同一个函数对象
};

const a = new User("A");
const b = new User("B");
a.sayHi === b.sayHi; // true
```

如果写成 `this.sayHi = function () {}`，每创建一个实例就会多创建一个函数，浪费内存。
如果写成 `this.sayHi = () => {}`，函数还会捕获当前实例的 `this`，这又是另一种语义。

`class` 和普通构造函数的差异主要有：

- class 必须用 `new` 调用，裸调用会抛错；
- class 声明有 TDZ，不能在声明前使用；函数声明会提升；
- class 内部默认严格模式；
- class 的方法默认不可枚举，普通 `prototype.method = ...` 默认可枚举；
- 派生类必须在访问 `this` 前调用 `super()`（或在 `super()` 前 `return` 一个对象）。

注意：不可枚举不代表不能访问，只是 `for...in`、`Object.keys(instance)` 这类枚举不会把原型方法列出来。

## Part 2 · 典例推演

```text
Ada makes a sound / woof
true
true
true
animal
true true
false true
```

- `d.speak()`：实例自身没有 `speak`，沿 `Dog.prototype` 找到；`super.speak()` 再用当前实例 `d` 调父方法。
- `Object.getPrototypeOf(d) === Dog.prototype`：`new Dog()` 把实例的原型设为 `Dog.prototype`。
- `Object.getPrototypeOf(Dog.prototype) === Animal.prototype`：这是 `extends` 建立的实例方法继承链。
- `Object.getPrototypeOf(Dog) === Animal`：这是 `extends` 建立的静态方法继承链。
- `Dog.kind()`：`Dog` 自身没有 `kind`，沿静态原型链找到 `Animal.kind`。
- `d instanceof Dog` / `d instanceof Animal`：`instanceof` 会沿原型链查找，两条都成立。
- `speak` 不在实例自身上，而在 `Dog.prototype` 上，所以最后一行是 `false true`。

## Part 3 · 项目落地

### 1. 为什么 MyLotion 不用文档类继承

MyLotion 的文档来自数据库 JSON，核心字段是：

```ts
interface DocumentRow {
  id: string;
  parentDocument: string | null;
  title: string;
  // ...
}
```

“文件夹 / 文件”的区别其实是数据里的父子关系，不是两套不同的对象行为。用类继承会有三个麻烦：

1. **序列化不对齐**：Supabase 返回普通对象，React state 也期望普通不可变对象；类实例要多一层转换。
2. **错误抽象**：文件夹和文档都可以被移动、归档、改名，差异小于共性，拆成 `FolderDocument` / `FileDocument` 会把共同逻辑切碎。
3. **继承层次脆弱**：以后加“公开页面”“模板”“数据库视图”，很容易变成多层 `extends`。行为更适合用纯函数和组合拼起来。

所以项目里是：

```text
DocumentRow（普通数据）
   + buildTree / collectSubtreeIds / selectSidebarRows（纯函数行为）
   + Map 索引（组合出的查询能力）
```

而不是：

```text
BaseDocument
  ├─ FolderDocument
  └─ FileDocument
       └─ PublishedFileDocument
```

### 2. TS 的 `interface extends` 不是原型继承

`src/tree.ts` 里有：

```ts
interface SidebarDocument {
  id: string;
  parentDocument: string | null;
}

interface TreeNode extends SidebarDocument {
  children: TreeNode[];
}
```

这是**编译期的类型扩展**：让 `TreeNode` 拥有 `SidebarDocument` 的字段约束。
编译成 JavaScript 后，interface 完全消失，运行时没有原型链，也不会创建构造函数。
面试里不要把「TS interface 继承」和「JS prototype 继承」混为一谈。

### 3. 真要区分多种文档类型怎么办

优先用**组合 + 判别联合**，而不是深层继承：

```ts
type Document =
  | { kind: "page"; content: unknown }
  | { kind: "database"; schema: unknown }
  | { kind: "canvas"; scene: unknown };
```

共同行为写成独立函数，用 `switch (doc.kind)` 或策略表分发；只有确实存在稳定的 is-a 关系、
并且子类需要复用大量实现时，才考虑 class 继承。面试里这句话可以说成：
**「优先组合（has-a），谨慎继承（is-a）。」**

## 及格线

能讲清三件事：

- 属性查找沿 `[[Prototype]]` 走到 `null`；
- ES5 用 `Object.create` 接原型链，ES6 `extends` 建立实例与静态两条链；
- 项目里的文档模型用普通对象、纯函数和组合，不用类继承；TS interface extends 不产生运行时原型链。
