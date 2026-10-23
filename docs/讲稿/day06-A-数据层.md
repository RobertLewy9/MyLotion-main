# Day 6 · A 轨 —— 数据层：一张表怎么撑起无限层级

> **归属：Day 6 · A 轨（MyLotion）**
> 今天要能回答三个问题：**为什么是一张表？索引建在哪、为什么？量和深度上来怎么办？**
> 代码已经写好了：`src/data/documents.ts`，12 个用例全绿。你要做的是读懂 + 讲出来。
> 口述顺序固定：**先说结论 → 再说查询长什么样 → 最后说取舍**。

## 一、表结构（口述版）

「文档就是一张 `documents` 表，**`parentDocument` 字段指向自己**，`NULL` 表示根节点。
所以无限层级不需要多张表，也不需要递归表结构 —— 整棵树就是这张表里的一堆行。」

```sql
create table documents (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null default '',
  content         jsonb,                          -- BlockNote 的文档 JSON
  parent_document uuid        references documents(id) on delete cascade,
  user_id         uuid        not null references auth.users(id),
  is_published    boolean     not null default false,
  is_archived     boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

| 字段 | 为什么存在 |
|------|-----------|
| `parent_document` | 自引用，`NULL` 是根；移动节点只改这一列 |
| `user_id` | 多租户隔离；所有查询都以它开头，RLS 也用它 |
| `is_published` | 公开预览：未发布的文档 RLS 直接拦掉 |
| `is_archived` | 归档是软删除，侧边栏默认不查 |
| `content` | 整篇文档的 JSON，**全量存一个字段**（这也是「无限写入」的瓶颈来源） |
| `updated_at` | 侧边栏排序 + 缓存失效 |

**一个必须说准的点**：`parentDocument` 自引用这套模型，专业名字就叫**邻接表（adjacency list）**。
面试时别说成「我用了自引用、没用邻接表」—— 那就是邻接表。真正要对比的是**闭包表 / 路径枚举**。

## 二、三条查询 ↔ 三个索引

索引不是「多建几个更快」，而是**每条查询对应一个索引**，说得出查询就说得清索引。

| 查询 | SQL 形态 | 索引 |
|------|----------|------|
| 侧边栏全量 | `where user_id = ? and is_archived = false order by updated_at desc` | `(user_id, updated_at desc)` |
| 懒加载子节点 | `where user_id = ? and parent_document = ?` | `(user_id, parent_document)` |
| 归档过滤 | 部分索引 `where is_archived = false` | `(user_id) where is_archived = false` |

**为什么 `user_id` 永远放最左**：复合索引遵守**最左前缀**，而且所有查询（包括 RLS 注入的条件）都会带 `user_id`，
把它放最左，一个索引能服务「按用户 + 按时间」「按用户 + 按父节点」两类查询。

**为什么排序索引要带 `desc`**：侧边栏按最近更新排，索引顺序和 `order by` 一致就不用额外排序。

## 三、今天的代码：两步取数

`src/data/documents.ts` 就两个函数：

**1. `selectSidebarRows(rows, { userId, includeArchived })`** —— 对应上面那条全量查询：

```ts
rows
  .filter((row) => row.userId === query.userId)          // 用户隔离
  .filter((row) => includeArchived || !row.isArchived)   // 归档过滤
  .slice()
  .sort(compareRows);                                    // 稳定排序
```

排序是**三级**的：`updatedAt` 降序 → `createdAt` 降序 → `id` 升序。
后两级叫**决胜规则（tie-breaker）**：同一毫秒创建的文档不能靠数组顺序决定先后，否则刷新一次顺序就变了。

**2. `indexByParent(rows)`** —— 一次 O(n) 扫描，得到 `Map<parentId, 子节点[]>`。
之后找「某个节点的直接子节点」是 O(1)，这就是**懒加载**要用的索引；它保持传入顺序，排序交给上一步。

**为什么都写成纯函数**：不改入参、返回新数组，测试好写，也方便以后换成真实 SQL 时保持同样的语义。

## 四、和 Day 1 / Day 2 串起来

```
selectSidebarRows（今天）→ buildTree（Day 1）→ 递归组件渲染
collectSubtreeIds（Day 2）→ 一次 in 批量 update（归档 / 恢复）
```

一句话：**取数在数据库做过滤和排序，建树和算子树在内存做** —— 前者省网络，后者省查询次数。

## 五、面试追问（三个必答 · 面经校准版）

**Q1：为什么用邻接表，不用闭包表？**
邻接表写起来最省：移动一个节点只改一行 `parent_document`；闭包表要维护「祖先-后代」的所有路径，
移动一次可能要改 O(子树大小) 行。我的场景是**读多写少、层级不深**，一次全量拉回内存建树就够了。
闭包表的优势是「查某节点的所有后代 / 所有祖先」一条 SQL 搞定，等我真需要频繁按子树查再迁。

**Q2：单用户 10 万篇文档，还全量拉吗？**
不全量。侧边栏只拉「最近更新的 N 篇 + 收藏 + 当前展开路径」，其余靠搜索和懒加载；
真要全量，也是分页 + 游标（`updated_at < 上一页最后一条`），而不是 offset。

**Q3：RLS 和应用层 `user_id` 过滤重复了吗？**
不重复，职责不同：应用层过滤让 SQL 走对索引、语义明确；RLS 是**兜底**，
保证就算某条查询忘了带 `user_id`，也读不到别人的数据。安全必须落在数据库层。

## 六、60 秒口述稿

「文档树用的是一张 `documents` 表，`parentDocument` 自引用，`NULL` 是根 —— 也就是标准的邻接表模型。
取数分两条路：侧边栏全量走 `where user_id and not is_archived order by updated_at desc`，
对应 `(user_id, updated_at desc)` 索引；懒加载子节点走 `where user_id and parent_document = ?`，
对应 `(user_id, parent_document)` 索引。`user_id` 放最左，是因为所有查询和 RLS 都会带它。
拉到内存后，先用 `selectSidebarRows` 做过滤和三级稳定排序，再用 `buildTree` 还原成树。
归档这类子树操作，先用 `collectSubtreeIds` 一次算出所有后代，再批量更新，避免逐层递归查库。
这套方案的取舍是：写简单、读一次拉全量；代价是深度极大或单用户文档极多时要迁闭包表或分页。」

## 七、今天的动作

1. 打开 `src/data/documents.ts`，对照本文第三节，把两个函数各讲一遍（1 分钟）。
2. 跑 `node node_modules/vitest/vitest.mjs run test/data/documents.test.ts`，看 12 个用例覆盖了哪些规则。
3. 回答第五节的 Q1~Q3，卡住的记进 `docs/日志/day06-全轨-日志.md`。