# Day 7 · A 轨 —— 侧边栏取数：全量建树 vs 懒加载（面经校准版）

> **归属：Day 7 · A 轨（MyLotion）**
> 2026-10-23 按 8 场面经校准：快手一面 Q8 原题就是
> 「无限层级文件夹的懒加载是纯前端还是结合后端？树结构什么时候确定？」
> 今天只回答这个深度：**前端懒加载 + 后端按 `parentId` 返回子节点**，不扩展到百万级容量推演。

## 一、一句话区分

| 模式 | 做法 | 首屏请求 | 适合 |
|------|------|----------|------|
| **全量** | 一次拉回所有可见文档，内存建树 | 1 次 | 文档少、要展示完整树 |
| **懒加载** | 只拉当前层，展开时再查 | 1 次 + 每层 1 次 | 文档多 / 树深 / 移动端 |
| **混合** | 首屏拉前两层，展开时懒加载 | 1 次 | 一般真实产品 |

## 二、全量模式：`getSidebarTree`

```ts
getSidebarTree(rows, { userId, includeArchived })
  = buildTree(selectSidebarRows(rows, query))
```

三步：过滤用户和归档 → 按 `updated_at` 排序 → 内存 `buildTree`。
对应一条 SQL 拉回当前用户未归档的文档，避免每层递归查库。

**代价**：文档多时 payload 和内存线性增长；数据变了要靠刷新或订阅失效。

## 三、懒加载模式：`getChildren`

```ts
getChildren(rows, parentId, { userId })
```

对应 SQL 按 `parent_document = ?` 取**直接子节点**，走 `(user_id, parent_document)` 索引；
`parentId = null` 取根节点。首屏只加载根，用户展开时再拉下一层，树结构是逐层确定的。

**三个工程细节**：
1. 展开时显示“加载中”；
2. 收起再展开可能重复请求 → 用 `pendingById` 去重（Day 8）；
3. 某一层失败只重试这一层。

## 四、内存索引：`createSidebarIndex`

全量已经拉回来了，但不想每次展开都重新 `filter`：

```ts
const { tree, childrenOf } = createSidebarIndex(rows, { userId });
childrenOf("doc-1"); // O(1)
```

底层是 `Map<parentId, 子节点[]>`。它和懒加载的区别是：**数据已经全在内存，省的是 CPU，不是网络。**

## 五、面试追问（三个足够）

**Q1：无限层级到底是纯前端还是结合后端？**
结合后端。前端负责“展开哪个节点”的交互和树节点渲染；后端只按 `parentId` 返回这一层的子节点。
如果纯前端，就必须一次把所有层拉回来，文档多时首屏会很重。

**Q2：展开时快速点开又收起，怎么防止重复请求？**
按 `parentId` 做请求去重：同一个 key 的并发请求共用一个 Promise；再加“已加载”标记，第二次展开直接用缓存。

**Q3：删除或归档一个节点后，树怎么更新？**
局部更新：从父节点的 children 中摘掉；让对应缓存失效。跨层级移动子树时，重拉受影响的那一层，别在前端手写递归修补。

## 六、60 秒口述稿

「侧边栏取数有两种模式。全量是 `getSidebarTree`：一条 SQL 把当前用户未归档的文档全拉回来，
按 `updated_at` 降序，再用 `buildTree` 在内存里 O(n) 建树 —— 好处是只有一次网络往返，避免 N+1；
代价是文档多了 payload 大。懒加载是 `getChildren`：只查 `parent_document = ?` 的直接子节点，
走 `(user_id, parent_document)` 索引，展开一层查一层，首屏快但请求多。
我项目里的无限层级是前端懒加载、后端按 parentId 按需返回；树结构不是初始化时一次确定的，而是随着展开逐层构建。
如果全量已经拉回来了、又不想每次展开重新过滤，就用 `createSidebarIndex` 建一个
`parentId -> children` 的 Map，之后取子节点是 O(1)。」

## 七、今天的动作

1. 读 `src/data/sidebar.ts`，对照本文讲一遍 `getSidebarTree` 和 `getChildren`。
2. 跑 `node node_modules/vitest/vitest.mjs run test/data/sidebar.test.ts`，确认 10 个用例。
3. 合上资料，回答第五节三个问题；卡住的记进 `docs/日志/day07-全轨-日志.md`。