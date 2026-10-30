# Day 8 · B1 轨题纸 —— 原型链与继承（面经校准版 · 20 分钟）

> **归属：Day 8 · B1 轨（前端八股）**
> 2026-10-29 按 8 场面经校准：腾讯云智一面原题是「继承在 JavaScript 中是如何实现的？」；
> B 站一面则把「基于原型」列为 JS 的语言特征。
> 今天只准备这条主线，不扩展到各种 ES5 继承写法大全，也不手写 Babel 的 `_inherits` helper。

## Part 1 · 概念（每题 2 分钟）

**1.** `prototype`、实例的 `[[Prototype]]`（常写作 `__proto__`）和 `constructor` 各是什么？
访问 `obj.name` 时，属性查找沿什么路径进行，在哪里结束？

**2.** JavaScript 的继承到底是怎么实现的？
先说清「构造函数 + 原型链」的 ES5 写法，再说 `class extends` 在原型链上建立了哪两条关系。

**3.** 为什么实例方法通常放在 `prototype` 上，而不是在构造函数里给每个实例各创建一份？
`class` 与普通构造函数相比，还有哪些语义差异？

## Part 2 · 典例推演（3 分钟）

先不看答案，逐行预测输出，并说明每一行查到了哪条原型链：

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
    super(name);
    this.breed = "corgi";
  }
  speak() {
    return `${super.speak()} / woof`;
  }
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

重点解释：`speak` 为什么不在实例上、`super.speak()` 的 `this` 是谁、静态方法为什么也能继承。

## Part 3 · 项目落地（2 分钟）

MyLotion 的文档是 `DocumentRow` / 树节点 `TreeNode`，并没有定义
`FolderDocument extends DocumentRow`、`FileDocument extends DocumentRow` 这样的类继承。

请回答：

1. 为什么这里用「普通对象 + 纯函数」比「文档类继承」更合适？
2. TypeScript 里的 `interface TreeNode extends SidebarDocument` 和 JS 的原型继承是一回事吗？
3. 如果以后真的出现 Page / Database / Canvas 多种文档类型，你会怎样建模？

> 答到「数据来自 JSON / 数据库、React 需要不可变普通对象、行为用组合而不是 is-a 继承」即可。
