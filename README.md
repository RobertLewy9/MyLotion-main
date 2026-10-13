# MyLotion

> 照着 Lotion 一天一个模块，亲手复刻 AI 笔记应用的核心逻辑。

Lotion 是一个全栈 AI 笔记应用：无限层级文档树、BlockNote 富文本编辑、DeepSeek Agent 自主增删改查笔记。
本仓库 **不是** Lotion 的分支或复制品，而是我把它的关键代码拆成一日一题、自己动手实现的练习场 —— 重点是**想清楚复杂度、写干净的函数、用测试验证行为**，而不是照抄。

## 当前进度

| Day | 主题 | 状态 |
|-----|------|------|
| Day 1 | 扁平数组还原成文档树（`buildTree`） | ✅ 已完成 |
| Day 2 | 一次算出整棵子树（`collectSubtreeIds`） | ✅ 已完成 |
| Day 3 | 文档提及解析（`extractMentions` / `truncateMentionTitle`） | ✅ 已完成 |

## Day 1 —— 扁平数组还原成文档树

Lotion 的 `documents` 表用 `parentDocument` 自引用实现「无限层级」，
`getSidebarAll()` 一次性把全部文档当**扁平数组**拉回来（避免 N 次查询），
前端再还原成**树**。Day 1 的任务就是用 **O(n)** 的两遍 `Map` 扫描，
替代朴素的递归 `filter`（O(n²)），把扁平数组还原成嵌套树。

覆盖的规则：

1. `parentDocument === null` 的文档是根节点
2. 其余文档挂到 `parentDocument` 对应节点的 `children` 里
3. 同级节点保持传入数组的相对顺序
4. `parentDocument` 指向不存在的文档时，该文档提升为根节点（孤儿节点不消失）
5. 纯函数：不修改传入的数组或对象

### 用法

```ts
import { buildTree, type SidebarDocument } from "@/src/tree";

const docs: SidebarDocument[] = [
  { id: "a", title: "根文档", parentDocument: null, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "b", title: "子文档", parentDocument: "a", createdAt: "2026-01-01T00:00:00.000Z" },
];

const tree = buildTree(docs);
// tree[0].children[0].id === "b"
```

## Day 2 —— 一次算出整棵子树

Lotion 的 `lib/db.ts` 里 `archive()` / `restore()` 是这么写的：拿到一个节点，
先查一次它的直接子节点，再对每个孩子递归调用自己 —— **每下一层就是一次网络往返**。
一棵 100 节点、5 层深的文档，归档一次要上百次查询（典型的 N+1），又慢又可能中途失败。

既然 Day 1 的 `getSidebarAll()` 已经能把整棵树当扁平数组一次拉回来，
「某文档的全部后代」就能在内存里 **O(n)** 算完，再拿这串 id 做**一次**批量更新
（`.in("id", ids)`）。Day 2 的题目就是写这个 `collectSubtreeIds`。

覆盖的规则：

1. 返回 `rootId` 的所有后代 id（子、孙、曾孙…），**不含 rootId 自身**
2. 顺序：广度优先（BFS）逐层展开；同一层按 `docs` 中的相对顺序
3. `rootId` 不在 `docs` 里 → 返回 `[]`（不抛错）
4. `rootId` 没有后代 → 返回 `[]`
5. 纯函数：不修改传入的数组或对象
6. 防环：数据损坏成 `a↔b` 时不能死循环，每个 id 最多出现一次

## Day 3 —— 文档提及解析

AI 面板的胶囊输入框选中某个文档后，会把这段文本发给服务端/Agent：

```
[@季度总结](9f8c1e2a)
```

服务端要先把用户这段话里所有提及「抠」出来，才知道用户 @ 了哪些文档，
再据此读文档内容、拼进模型上下文。对应 Lotion 的 `lib/mention.ts`。

覆盖的规则：

1. `extractMentions(text)`：匹配 `[@标题](id)`，标题不含 `]`、id 为字母/数字/连字符且长度 3~64
2. 按出现顺序返回；标题去首尾空白，空标题跳过；同一 id 只保留首次出现
3. `truncateMentionTitle(title, maxChars = 4)`：先 trim，超长则截断并补 `…`
4. 纯函数、可重复调用（注意带 `g` 的正则 `lastIndex` 是有状态的）

## 技术栈

- **TypeScript**（`strict` 模式，`noEmit`，仅做类型检查）
- **Vitest** 4 —— 单元测试与 watch 模式
- **pnpm** —— 包管理（仓库内含 `pnpm-lock.yaml`）
- 路径别名 `@/*` 指向仓库根目录

## 目录结构

```
MyLotion-main/
├── src/
│   ├── tree.ts          # Day 1：buildTree —— 扁平数组还原成文档树
│   ├── subtree.ts       # Day 2：collectSubtreeIds —— 一次算出整棵子树
│   ├── mention.ts       # Day 3：extractMentions / truncateMentionTitle —— @提及解析
│   ├── interview/       # 手撕题库（EventEmitter / LRU / 防抖节流…）
│   └── test.js          # 随手写的 JS 草稿
├── test/
│   ├── tree.test.ts     # buildTree 的单元测试（vitest）
│   ├── subtree.test.ts  # collectSubtreeIds 的单元测试（vitest）
│   ├── mention.test.ts  # 提及解析的单元测试（vitest）
│   └── interview/       # 手撕题用例
├── docs/
│   ├── 学习策略.md       # 学习策略 v2（依据 8 场面经制定）
│   ├── 学习计划.md       # 每日三轨模板 + Day4~10 路线图 + 打卡表
│   ├── 架构总览.md       # Lotion 端到端全流程（理解整套流程）
│   ├── 面经考点.md       # 面经考点清单（自测用）
│   └── 讲稿/             # 每天的口述稿（_模板 + 示例）
├── package.json         # npm scripts 与依赖
├── tsconfig.json        # TypeScript 编译配置
└── vitest.config.mts    # Vitest 配置（node 环境 + @ 别名）
```

## 快速开始

### 前置要求

- Node.js 18+
- pnpm

### 安装与测试

```bash
# 1. 安装依赖
pnpm install

# 2. 运行测试（等价于 npx vitest run）
pnpm test

# 3. watch 模式，边写边测
pnpm test:watch

# 4. 只跑某一天的用例
npx vitest run test/mention.test.ts
```

> 注：Day 1 ~ Day 3 的用例目前全绿（11 + 11 + 16 = 38）。

## 学习路线

- [x] **Day 1** —— 扁平数组 → 文档树（`buildTree`，O(n) 两遍扫描）
- [x] **Day 2** —— 一次算出整棵子树（`collectSubtreeIds`，BFS + 防环）
- [x] **Day 3** —— 文档提及解析（`extractMentions` / `truncateMentionTitle`）
- [ ] 待续……

> Day 3 起调整为**讲解驱动**：MyLotion 继续推进，但代码不再手敲，重点转向
> 「读懂整套流程 + 讲清楚 + 每天带八股和手撕」。
> 每日安排见 docs/学习计划.md，架构全景见 docs/架构总览.md，考点清单见 docs/面经考点.md。

## 参考

- **Lotion** —— 全栈 AI 笔记应用（无限层级文档树 + BlockNote + DeepSeek Agent），本仓库的练习原型
- Lotion 中对应实现：`lib/db.ts` 的 `getSidebarAll()` / `archive()` / `restore()`、`lib/mention.ts`、`document-list.tsx` 的递归树渲染
