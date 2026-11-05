# Day 9 · A 轨 —— 缓存失效、fresh 与 prefetch

> **归属：Day 9 · A 轨（MyLotion）**
> 日期：2026-11-05
> 代码：`src/data/document-cache.ts`；用例：`test/data/document-cache.test.ts`（18 个）。
> 目标：在 Day 8 的并发去重 + LRU 之上，讲清“数据变了怎么失效、想强制刷新怎么办、提前加载怎样不打扰页面”。

## 一、一句话（10 秒）

> 文档缓存用 `Map` 做有上限的 LRU；写操作后主动 `invalidate`，需要绕过旧值时用 `fresh`，侧边栏预取用 `prefetch` 后台预热，失败不缓存、不弹错。

## 二、Day 8 已经解决了什么

- `pending`：同一个文档的并发请求只发一次。
- `values`：成功结果留在内存，再次读取直接命中。
- LRU 200：Map 按最近使用顺序排列，超限淘汰最旧。
- `invalidate / clear`：数据变化时清掉缓存，并阻止旧请求晚到后回填。

Day 9 继续补三个实际场景：

1. **更新之后**：本地或远端修改了文档，旧缓存不能继续用。
2. **强制刷新**：编辑页从后台回到前台，想拿最新版本，但并发请求仍不能翻倍。
3. **提前加载**：鼠标悬停或侧边栏预判用户会打开文档，提前请求，但不能阻塞 UI，也不能因为失败弹错。

## 三、思维导图

```text
DocumentCache
├─ values：成功结果 + LRU 顺序
├─ pending：同一 id 的在途请求
├─ get(id, fetcher)
│  ├─ 默认：pending → values → fetch
│  └─ fresh：pending → fetch（跳过 values）
├─ prefetch(id, fetcher)
│  └─ 后台调用 get；失败静默，下一次仍可重试
├─ invalidate(id)
│  └─ 同时删 values + pending，阻止旧响应回填
└─ clear()
   └─ 清空全部缓存与在途记录
```

## 四、四个关键流程

### 1. update 后为什么调用 `invalidate`

写接口成功后，服务端已经有新版本，但浏览器里可能还留着旧值。

```ts
await updateDocument(id, patch);
cache.invalidate(id);
```

`invalidate` 做两件事：

1. 删除已完成缓存；
2. 删除该 id 的在途请求记录。

第二步很重要。假设旧请求还在路上，只删 `values` 不够；旧请求晚到后仍可能把旧数据写回缓存。代码在回填前检查当前 pending 是否仍是同一条请求，不是就丢弃。

### 2. `fresh` 和 `invalidate` 有什么区别

- `invalidate`：明确知道数据已经变了，先让缓存失效；下一次普通 `get` 会重新加载。
- `fresh: true`：调用方这一次不想读旧缓存，直接请求最新值；成功后用新结果覆盖旧值。

```ts
const doc = await cache.get(id, fetchDocument, { fresh: true });
```

`fresh` 仍然先看 pending：

- 已经有同一 id 的请求在路上，就复用它；
- 不会因为“强制刷新”再把并发请求翻倍。

如果 fresh 请求失败，旧缓存不会被删除；调用方要区分“刷新失败但还能展示旧值”和“数据已变化必须失效”这两种语义。真正写后失效仍应调用 `invalidate`。

### 3. `prefetch` 为什么吞掉错误

```ts
cache.prefetch(id, fetchDocument);
```

它是后台预热，不是用户主动提交，所以：

- 不阻塞当前渲染；
- 失败不缓存；
- 错误不冒泡到页面；
- 用户真正打开文档时还能重试；
- 如果已经缓存或已有在途请求，不会重复加载。

预取要有节制：只对高概率访问的文档做，别把整棵树一次全预取，否则会抢带宽、增加服务端压力，还会把 LRU 缓存挤掉真正正在看的文档。

### 4. 为什么调用方 `await get()` 后不能再看到旧 pending

缓存返回的是一条完整 promise：加载、回填、清理 pending 都包含在内。

```text
request
  → then(回填 values)
  → finally(删除 pending)
  → 调用方拿到 resolve
```

这样调用方 `await` 回来时，pending 已经清理完毕；紧接着发 `fresh` 不会误复用上一条请求。这个时序由新增用例固定下来。

## 五、完整读取顺序

```text
get(id, fetcher, options)
  ├─ 有同 id 在途请求：直接复用
  ├─ 非 fresh 且 values 命中：touch 到队尾并返回
  └─ 发请求
      ├─ 成功：回填 values → LRU 超限淘汰
      ├─ 失败：不缓存
      └─ 最后：清理 pending
```

`touch` 就是先 `delete` 再 `set`，利用 Map 的插入顺序把该条移到队尾。读取命中也会刷新 LRU。

## 六、复杂度与边界

- `get / invalidate / prefetch`：平均 O(1)。
- `remember` 淘汰：每条最多删除一次，均摊 O(1)。
- 空间：最多 `capacity` 条已完成结果 + 当前在途请求。
- `capacity = 0`：不保留结果，但仍合并并发请求。
- 失败结果不缓存，允许下一次重试。
- `undefined` 也是合法缓存值，所以判断命中必须用 `has`，不能靠真值判断。

## 七、2 分钟口述版

> Day 8 的文档缓存用 pending Map 合并并发请求，用 values Map 存成功结果，并靠 Map 的插入顺序做 200 条 LRU。Day 9 补了失效和预取：写操作成功后调用 invalidate，同时清掉已完成缓存和在途请求，防止旧响应回填；编辑页需要最新值时可以传 `{ fresh: true }`，它会绕过已完成缓存，但同 id 的在途请求仍会合并；侧边栏预取用 prefetch 后台预热，失败静默且不缓存，真正打开时还能重试。为了保证 `await get()` 后紧接着 fresh 不会误拿旧 pending，我把回填、清理和调用方 resolve 串在同一条 promise 上，并补了 5 个用例，目前 18 个测试全绿。

## 八、追问预判

### 为什么不直接用 WeakMap

文档 id 是字符串，WeakMap 不能以字符串为键；而且我们需要 `size`、遍历淘汰和明确的 LRU 顺序。WeakMap 适合“把对象和附加信息绑定，又不阻止对象回收”，不适合这种需要容量管理的字符串键缓存。

### 多标签页怎么失效

本模块只解决单页内存缓存。真实应用可通过 Supabase Realtime / BroadcastChannel 广播 `{type: "note_updated", id}`，收到后调用 `invalidate(id)`；版本号或更新时间可用于拒绝乱序旧响应。

### prefetch 把缓存挤掉怎么办

预取应低于用户主动读取的优先级，可只在悬停、可见区域或小批量场景使用；必要时把预取结果放独立小容量队列，或根据访问概率决定淘汰策略。

### 写操作后为什么不等下一次 get 再处理

可以，但下一次 get 可能先命中旧值。更稳妥的是写成功后立即失效，把“数据已变”的错误窗口缩到最小。

## 九、20 分钟自测

- [ ] 说出 pending、values、LRU 三者的分工。
- [ ] 解释 `invalidate` 为什么同时删 values 和 pending。
- [ ] 区分 `invalidate` 与 `fresh: true`。
- [ ] 说明 `prefetch` 为什么吞错，以及什么时候不该预取。
- [ ] 讲清 pending 清理与调用方 resolve 的时序竞态。
- [ ] 跑通 18 个用例，并能回答“为什么不是 WeakMap”。
