# Day 6 · B1 轨答案 —— 闭包（面经校准版）

> **归属：Day 6 · B1 轨（前端八股）**
> 依据：B站一面 Q6、CSIG 一面 Q18。两家都把柯里化列为闭包用途，但没有要求手写；目标是能口述，不扩展成实现专题。

## 1. 闭包是什么？

**一句话**：闭包是函数和它定义时所在词法环境的组合；即使外层函数已经执行完，内层函数仍然能访问那个环境里的变量。

```js
function counter() {
  let n = 0;
  return function () {
    return ++n;
  };
}
const next = counter();
next(); // 1
next(); // 2
```

关键点是**词法作用域在定义时确定**，不是调用时确定。

**常见使用场景**：
1. 私有变量：外部不能直接改 `n`，只能通过返回的方法访问；
2. 防抖 / 节流：闭包保存 `timer`，每次调用都能拿到上一次的定时器；
3. 函数柯里化：把多参数函数拆成逐个接收参数的函数链（如 `add(1)(2)(3)`），这里只要求会举例；
4. 回调保存状态：事件回调、定时器回调需要记住创建时的某些变量。

## 2. 为什么可能内存泄漏？

闭包会让它引用的变量在函数仍然可达时继续保留。这不等于“有闭包就泄漏”。

真正的泄漏是：**业务上已经不需要了，但还有引用让它不可回收**。常见三种：
- 定时器没清：`setInterval` 的回调一直挂在定时器系统上；
- 事件监听没移除：组件卸载了，监听器还挂在 `window/document` 上；
- 无上限缓存：Map/数组一直增长，里面的 value 又被闭包引用。

一句话判断：**“谁还引用着这个闭包？这个引用还需要吗？”**

## 3. 闭包和防抖的关系

防抖的核心就是闭包保存上一次的定时器：

```js
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

如果 `timer` 放全局，两个防抖函数会互相覆盖；放闭包里，每个返回的函数有自己独立的状态。
组件卸载时还要提供并调用 `cancel()`，否则定时器仍可能持有回调。

## Part 2 · 项目落地

### `pendingById`

**① 干什么**：同一篇文档被多个组件同时请求时，只发一次网络请求。

**② 完整流程**：
```js
const pendingById = new Map();

function getById(id) {
  if (pendingById.has(id)) return pendingById.get(id);

  const promise = fetchDocument(id).finally(() => {
    pendingById.delete(id);
  });
  pendingById.set(id, promise);
  return promise;
}
```
第一个调用创建 Promise 并放进 Map；后续调用直接拿到同一个 Promise；`finally` 无论成功失败都清理。

**③ 为什么用闭包/Map**：去重需要跨组件共享状态，不能放在单个组件里；key 用文档 id，
`finally` 清理，生命周期随着请求结束而结束。

### `debounce`

**① 干什么**：编辑器 `onChange` 触发很频繁，停止输入 300ms 后再保存。

**② 完整流程**：每次输入清除上一个定时器，重新计时；只有用户停下来一段时间才真正调保存接口。

**③ 为什么用闭包**：`timer` 是这份防抖函数私有的状态，不应污染全局，也不该和其他实例互相覆盖。

### 追问：会串吗？

- `pendingById` 的 key 是文档 id，文档本身带用户隔离；不同请求共享的是“同一篇文档的同一个请求”，不是用户私有状态。
- 如果 key 换成 `userId` 或模块级保存“当前用户草稿”，就可能串；这时应按请求或用户实例创建状态。
- 闭包本身不可达时会被回收；挂在定时器、事件监听、全局 Map 上的闭包，要等引用被清掉才回收。

## 及格线

三问能各讲 30 秒，并能把 `pendingById` 或 `debounce` 讲成完整流程。柯里化只要作为闭包用途一句话带过，不要求手写。