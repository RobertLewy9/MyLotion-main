# Day 8 · B1 轨答案 —— 原型链与继承（面经校准版）

> **归属：Day 8 · B1 轨（前端八股）**
> 依据：腾讯云智一面「继承在 JavaScript 中是如何实现的？」；B 站一面「JS 是基于原型的语言」。
> 回答顺序：先说属性查找，再说继承实现，最后说 `class` 与项目取舍。

## Part 1 · 概念

### 1. `prototype`、`[[Prototype]]`、`constructor`

**一句话：**

原型机制主要是为了让多个对象共用方法。构造函数通过 `prototype` 提供一个公共位置，实例通过内部连接 `[[Prototype]]` 指向它。自己找不到属性时，就沿着这条连接往上找，这就是原型链。

**三个术语：**

| 名词 | 人话理解 |
|---|---|
| `Constructor.prototype` | 构造函数提供的公共位置，存放实例可以共用的方法 |
| `[[Prototype]]` | 对象内部的连接，找不到属性时沿着它往上找 |
| `prototype.constructor` | 默认指回对应的构造函数 |

```js
function User(name) {
  this.name = name;
}

const user = new User("Ada");

Object.getPrototypeOf(user) === User.prototype; // true
User.prototype.constructor === User;            // true
user.constructor === User;                      // true
```

**`new User("Ada")` 做了什么？**

1. 创建一个新对象；
2. 将新对象的 `[[Prototype]]` 指向 `User.prototype`；
3. 以新对象作为 `this` 执行构造函数；
4. 没有显式返回另一个对象时，返回新对象。

**原型链查找：**

访问 `user` 的属性时，先找自己，找不到就依次往上找：

`user → User.prototype → Object.prototype → null`

**补充：箭头函数为什么没有 `prototype`？**

箭头函数不能作为构造函数，不能使用 `new` 创建实例，因此没有 `prototype` 属性。

```js
function fn() {}
const arrow = () => {};

fn.prototype;    // 有
arrow.prototype; // undefined
new arrow();      // TypeError
```

**面试总结：**

原型机制用于实现对象之间的方法共享。构造函数通过 `prototype` 提供公共位置，实例通过 `[[Prototype]]` 指向它。访问属性时，如果自身找不到，就沿原型链向上查找，直到找到或到达 `null`。


### 2. JavaScript 的继承怎么实现

**一句话：**

JS 继承的本质是通过原型链，让子类能够使用父类的属性和方法。现代开发中主要使用 `class extends` 实现。

**基本写法：**

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
    super(name); // 调用父类构造函数
    this.breed = "corgi";
  }

  speak() {
    return `${super.speak()} / woof`;
  }
}

const dog = new Dog("Ada");
dog.speak(); // Ada makes a sound / woof
```

**三个核心知识点：**

1. `extends`：让子类继承父类。
2. `super()`：调用父类构造函数，必须在使用 `this` 之前调用。
3. `super.method()`：调用父类的方法，`this` 仍指向当前实例。

**原型链补充：**

```js
Dog.prototype.__proto__ === Animal.prototype; // 实例方法继承
Dog.__proto__ === Animal;                     // 静态方法继承
```

**面试总结：**

JS 继承主要通过原型链实现。使用 `extends` 建立父子类关系，`super` 调用父类的构造函数和方法，从而实现属性和方法的复用。JS 的 class 继承有两条原型链：一条让子类实例继承父类的普通方法，另一条让子类本身继承父类的静态方法。

### 3. 为什么方法要放在 `prototype`？

**一句话：** 属性每个实例各有一份，公共方法可以共享，所以通常放在 `prototype` 上，节省内存。

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

**记住：属性放实例上，公共方法放 prototype 上。**

---

## Part 2 · 典例推演

```js
Object.getPrototypeOf(d) === Dog.prototype; // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
Object.getPrototypeOf(Dog) === Animal; // true

d instanceof Dog;     // true
d instanceof Animal;  // true
```

**理解这几个结果：**

- `d.speak()`：沿原型链查找方法。
- `Object.getPrototypeOf(d)`：查看实例的原型。
- `Object.getPrototypeOf(Dog.prototype)`：查看父类的原型。
- `Object.getPrototypeOf(Dog)`：查看父类本身，对应静态方法继承。
- `instanceof`：检查父类或子类的 `prototype` 是否在实例的原型链上。

---

## Part 3 · 项目落地

### 1. 为什么 MyLotion 不用文档类继承？

MyLotion 的文档来自数据库，主要是普通对象：

```ts
interface DocumentRow {
  id: string;
  parentDocument: string | null;
  title: string;
}
```

项目使用：

```text
DocumentRow（普通数据）
  + buildTree / collectSubtreeIds（纯函数）
  + Map 索引（辅助查询）
```

而不是把文件夹、文件拆成不同的继承类。

**原因：**

1. 数据库返回普通对象，直接使用更方便。
2. 文件夹和文件有很多共同操作，不需要重复设计继承类。
3. 组合更灵活，避免继承层次越来越复杂。

### 2. TS 的 `interface extends` 不是原型继承

```ts
interface SidebarDocument {
  id: string;
  parentDocument: string | null;
}

interface TreeNode extends SidebarDocument {
  children: TreeNode[];
}
```

这里的 `extends` 只是**类型扩展**，让 `TreeNode` 拥有父接口的字段约束。

编译成 JS 后，interface 会消失，不会建立原型链。

### 3. 多种文档类型怎么办？

优先使用组合和判别联合，而不是多层类继承。

```ts
type Document =
  | { kind: "page"; content: unknown }
  | { kind: "database"; schema: unknown }
  | { kind: "canvas"; scene: unknown };
```

通过 `kind` 区分类型，再用 `switch` 处理不同逻辑。

**核心思想：优先组合（has-a），谨慎继承（is-a）。**

---

## 及格线

能讲清三件事：

1. 属性放实例上，公共方法放 `prototype` 上，实现方法共享。
2. JS 继承通过原型链实现；`extends` 同时建立实例方法和静态方法继承链。
3. MyLotion 使用普通对象、纯函数和组合；TS `interface extends` 不产生运行时原型链。
