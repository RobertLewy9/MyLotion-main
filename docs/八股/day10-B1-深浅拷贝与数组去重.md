# Day 10 · B1 轨 —— 深浅拷贝与数组去重（问答一体）

> **归属：Day 10 · B1 轨（前端八股）**
> 依据：深拷贝、`structuredClone`、循环引用和数组去重是前端手撕与项目追问的高频组合。
> 用法：先口述结论，再看题下答案；项目题必须落到 MyLotion 的树、缓存或侧边栏更新。

## 思维导图

```text
拷贝
├─ 赋值：同一引用
├─ 浅拷贝：新容器，嵌套对象仍共享
│  ├─ Object.assign / 展开
│  └─ slice / concat（数组）
├─ 深拷贝：递归复制嵌套结构
│  ├─ JSON：只适合纯 JSON 数据
│  ├─ structuredClone：内置类型较全，函数 / DOM 不行
│  └─ 手写：WeakMap 防环 + 分类处理
└─ 数组去重
   ├─ Set：原始值，SameValueZero
   ├─ Map：按业务 id
   └─ 对象不能按内容自动去重
```

## Part 1 · 概念

### Q1（回炉）. `Map`、`WeakMap` 和普通对象存的是值还是引用？为什么浅拷贝后还会“串”？

**参考答案（口述）**

它们存的都是引用。容器本身被复制，不代表容器里的对象也被复制。

```js
const source = { profile: { name: "Ada" } };
const copy = { ...source };

copy.profile.name = "Bob";
console.log(source.profile.name); // "Bob"
```

`copy` 是新的外层对象，但 `profile` 仍指向同一个对象。`Object.assign`、展开运算符、数组的 `slice` / `concat` 都是这个行为。

`Map` 的键和值也是引用；`WeakMap` 的键是弱引用，但值仍可能强引用别的对象。把对象放进缓存后，如果外部继续改同一个对象，缓存里看到的也会变。

**一句话：** 浅拷贝只换容器，不换里面的对象；要隔离嵌套数据，必须深拷贝或做不可变更新。

### Q2. 深拷贝和浅拷贝有什么区别？`JSON` 和 `structuredClone` 各有什么坑？

**参考答案（口述）**

| 方式 | 复制层级 | 主要问题 |
|---|---|---|
| 赋值 | 不复制 | 完全同一个引用 |
| 展开 / `Object.assign` | 只复制第一层 | 嵌套对象仍共享 |
| `JSON.parse(JSON.stringify(x))` | 递归复制 | 只适合 JSON 安全数据 |
| `structuredClone(x)` | 递归复制 | 函数、DOM、Promise、WeakMap 等不能克隆 |
| 手写深拷贝 | 自行控制 | 要处理循环引用和内置类型 |

`JSON` 方案会丢数据：

- `undefined`、函数、`Symbol` 会消失；
- `Date` 变成字符串；
- `Map`、`Set` 变成空对象；
- `NaN`、`Infinity` 变成 `null`；
- 循环引用直接抛错；
- 自定义原型和属性描述符不保留。

`structuredClone` 更适合现代浏览器：

```js
const copy = structuredClone(source);
```

它支持循环引用、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer` 等，但**不能克隆函数、DOM 节点、Promise、WeakMap / WeakSet**；类实例通常也会丢掉原型，变成普通对象。

**选择：** 纯数据优先 `structuredClone`；需要保留原型、函数或特殊业务对象时，手写或使用成熟库。

### Q3. 手写深拷贝要考虑什么？循环引用怎么处理？

**参考答案（口述）**

先判断原始值直接返回；对象要按类型处理，并用 `WeakMap` 记录“原对象 → 新对象”，避免循环引用无限递归。

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  if (value instanceof Map) {
    const result = new Map();
    seen.set(value, result);
    for (const [key, item] of value) {
      result.set(deepClone(key, seen), deepClone(item, seen));
    }
    return result;
  }

  if (value instanceof Set) {
    const result = new Set();
    seen.set(value, result);
    for (const item of value) result.add(deepClone(item, seen));
    return result;
  }

  const result = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value));

  seen.set(value, result);
  for (const key of Reflect.ownKeys(value)) {
    result[key] = deepClone(value[key], seen);
  }
  return result;
}
```

要能说出取舍：

- `WeakMap` 只用于记录已克隆对象，不阻止原对象回收；
- `Reflect.ownKeys` 能同时拿到字符串键和 Symbol 键；
- 数组、`Date`、`Map`、`Set` 要单独处理，不能只遍历普通属性；
- 函数、DOM、Promise 通常不深拷贝，按业务决定保留引用或抛错；
- 属性描述符、getter/setter、不可枚举属性是否保留，要看业务要求；面试先说主流程，再补这些边界。

### Q4. 数组去重有哪些写法？对象数组为什么不能直接用 `Set`？

**参考答案（口述）**

**原始值：**

```js
const unique = [...new Set(list)];
```

`Set` 使用 SameValueZero 比较：

- `NaN` 和 `NaN` 视为相同，只保留一个；
- `0` 和 `-0` 视为相同；
- 保留第一次出现的顺序。

**对象数组：**

```js
const map = new Map();
for (const item of list) map.set(item.id, item);
const unique = [...map.values()];
```

`Set` 只能去掉“同一个引用”的重复对象，两个内容相同但引用不同的对象仍会同时存在。业务上通常按 `id` 去重，而不是按整个对象内容比较。

不要用 `filter + indexOf` 处理大数组：时间是 O(n²)，而且 `indexOf` 找不到 `NaN`。也不建议用 `JSON.stringify` 当通用去重键：对象键顺序、`undefined`、函数和循环引用都会出问题。

## Part 2 · 项目落地

### Q5. MyLotion 里哪些地方容易误改原对象？你会怎么定拷贝策略？

**参考答案（口述）**

先分清“只读共享”和“需要隔离修改”：

1. **侧边栏取数**：`selectSidebarRows` 返回新数组，但数组里的 row 对象仍是共享引用。排序、过滤可以共享；要改标题或归档状态时必须生成新对象。
2. **文档缓存**：`DocumentCache` 里的 value 是对象引用。默认约定缓存值只读，更新时用新对象覆盖并 `invalidate`，不要就地改缓存对象。
3. **归档 / 恢复**：`planArchiveRestore` 只计算 id 列表和脱钩信息；`applyArchivePlan` 返回新的 rows，不修改原数组，适合 React 乐观更新。
4. **合并实时更新**：侧边栏或子节点列表按 `id` 放进 `Map`，后到的数据覆盖旧值；如果消息可能乱序，就比较 `updatedAt` 或版本号，而不是盲目覆盖。

**策略：**

- 高频只读数据尽量共享引用，避免每层都深拷贝；
- 需要修改的节点采用 copy-on-write，只复制变化路径；
- 跨组件传递的大对象默认约定不可变；
- 只有确实需要隔离的配置、草稿或第三方输入才做深拷贝。

**一句话：** 拷贝不是越多越安全；先约定不可变边界，再在边界上复制。

## 30 秒复盘

赋值共享同一个引用；浅拷贝只复制第一层，嵌套对象仍共享；深拷贝递归复制，但 JSON 会丢类型，`structuredClone` 不能处理函数和 DOM，手写要用 `WeakMap` 防环并按 Date / Map / Set / 数组分类。原始值去重用 `Set`，对象数组按业务 id 用 `Map` 去重。MyLotion 中缓存和列表默认只读共享，修改时 copy-on-write，归档恢复返回新 rows，不就地改缓存。

## 自测清单

- [ ] 能用 `{ ...obj }` 的例子说明浅拷贝为什么“串”。
- [ ] 能说出 JSON 深拷贝至少四个丢数据的场景。
- [ ] 能说出 `structuredClone` 支持什么、不能克隆什么。
- [ ] 能手写带 `WeakMap` 的深拷贝，并处理 Date / Map / Set。
- [ ] 能解释 `Set` 去重对 `NaN`、0 / -0 和对象引用的行为。
- [ ] 能说清 MyLotion 的缓存为什么默认只读共享，什么情况下才深拷贝。
