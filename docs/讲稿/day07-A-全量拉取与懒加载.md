# Day 7 · A 轨 —— 侧边栏取数：全量建树 vs 懒加载

> **归属：Day 7 · A 轨（MyLotion）**
> 代码：`src/data/sidebar.ts`（`getSidebarTree` / `getChildren` / `createSidebarIndex`），10 个用例全绿。
> 今天要能回答：**为什么全量？什么时候懒加载？混合策略怎么设计？**

## 一、一句话区分

| 模式 | 做法 | 首屏请求 | 适合 |
|------|------|----------|------|
| **全量** | 一次拉回所有可见文档，内存建树 | 1 次 | 文档少、要展示完整树 |
| **懒加载** | 只拉当前层，展开时再查 | 1 次 + 每层 1 次 | 文档多 / 树深 / 移动端 |
| **混合** | 首屏拉前两层，展开时懒加载 | 1 次 | 大多数真实产品 |

## 二、全量模式：`getSidebarTree`

```ts
getSidebarTree(rows, { userId, includeArchived })
  = buildTree(selectSidebarRows(rows, query))
```

三步：**过滤（用户 + 归档）→ 排序（`updated_at` 降序）→ 建树（O(n) 两遍扫描）**。
对应 SQL 就一条：

```sql
select id, title, parent_document, created_at, updated_at
from documents
where user_id = $1 and is_archived = false
order by updated_at desc, created_at desc, id asc;
```

**为什么值得全量**：如果每个节点都去查一次子节点，就是典型的 **N+1** ——
1000 个节点、5 层深，可能要上百次查询。一次拉回、内存建树，网络往返只剩 1 次。

**代价**：payload 和内存随文档数线性增长；而且一次拉全量意味着**实时性靠刷新**，
别人改了数据你不会自动知道（要靠订阅 / 失效机制，Day 9 讲）。

## 三、懒加载模式：`getChildren`

```ts
getChildren(rows, parentId, { userId })
```

对应 SQL：

```sql
select ... from documents
where user_id = $1 and parent_document = $2
order by updated_at desc;
```

走 `(user_id, parent_document)` 索引，只取**直接子节点**（不含孙节点）。
`parentId = null` 取根节点。

**三个工程细节**：
1. **加载态**：展开时才发请求，所以节点要能显示「加载中」；
2. **重复展开**：用户快速收起再展开，会重复发请求 → 用 `pendingById` 去重（Day 8）；
3. **失败重试**：某一层拉失败，只重试这一层，不要把整棵树打回重来。

## 四、内存索引模式：`createSidebarIndex`

全量已经拉回来了，但不想每次展开都重新 `filter` 一遍：

```ts
const { tree, childrenOf } = createSidebarIndex(rows, { userId });
childrenOf("doc-1"); // O(1)
```

底层是 `Map<parentId, 子节点[]>`，一次 O(n) 扫描建好。
它和懒加载的区别是：**数据已经全在内存**，省的是 CPU，不是网络。

## 五、怎么选（面试就这么答）

- **文档 < 2000 且要在侧边栏展示完整树** → 全量，简单、一次 RTT；
- **文档上万 / 层级很深 / 移动端弱网** → 懒加载，首屏只拉一层；
- **大多数产品** → 混合：首屏拉前两层 + 展开时懒加载 + 收起时保留已加载结果；
- **再大**（十万级）→ 侧边栏只显示「最近更新 N 条 + 收藏 + 当前路径」，
  其余靠搜索，而不是把树全画出来。

## 六、面试追问（五个）

**Q1：100 万篇文档还能全量吗？**
不能。payload 和内存都扛不住。要么侧边栏只拉「最近 N 条 + 收藏 + 当前展开路径」，
要么游标分页（`updated_at < 上一页最后一条`），要么直接转搜索优先的交互。

**Q2：全量拉回来，怎么保证别人改了我也能看到？**
全量模式靠刷新 / 失效重拉；要做实时，就得上订阅（Supabase Realtime）或者轮询 + 版本号。
这也是「全量」最大的隐性成本。

**Q3：展开时同时点开好几个节点，怎么防止重复请求？**
按 `parentId` 做请求去重：同一个 key 的并发请求共用一个 promise；
再加「已加载」标记，第二次展开直接用缓存。

**Q4：排序为什么放数据库，不放内存？**
因为排序 + 分页要一起做，放数据库能走索引；内存排序必须先把全量拉回来，
数据量大时等于把网络和内存都浪费了。

**Q5：删除 / 归档一个节点后，树怎么更新？**
小改动用局部更新（从父节点的 children 里摘掉），并让缓存失效；
跨层级的大改动（移动子树）直接重拉当前层，别在前端手写递归修补。

## 七、60 秒口述稿

「侧边栏取数有两种模式。**全量**是 `getSidebarTree`：一条 SQL 把当前用户未归档的文档全拉回来，
按 `updated_at` 降序，再用 `buildTree` 在内存里 O(n) 建树 —— 好处是只有一次网络往返，避免 N+1；
代价是文档多了 payload 大、实时性差。**懒加载**是 `getChildren`：只查 `parent_document = ?` 的直接子节点，
走 `(user_id, parent_document)` 索引，展开一层查一层，首屏快但请求多。
真实产品一般用混合：首屏拉前两层，展开时懒加载，收起时保留结果。
如果全量已经拉回来了、又不想每次展开重新过滤，就用 `createSidebarIndex` 建一个
`parentId -> children` 的 Map，之后取子节点是 O(1)。
」