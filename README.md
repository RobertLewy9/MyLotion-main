# MyLotion

> 照着 Lotion 一天一个模块，亲手复刻 AI 笔记应用的核心逻辑。

Lotion 是一个全栈 AI 笔记应用：无限层级文档树、BlockNote 富文本编辑、DeepSeek Agent 自主增删改查笔记。
本仓库 **不是** Lotion 的分支或复制品，而是我把它的关键代码拆成一日一题、自己动手实现的练习场 —— 重点是**想清楚复杂度、写干净的函数、用测试验证行为**，而不是照抄。

## 当前进度

| Day | 主题 | 状态 |
|-----|------|------|
| Day 1 | 扁平数组还原成文档树（`buildTree`） | ✅ 已完成 |
| Day 2 | 一次算出整棵子树（`collectSubtreeIds`） | 🚧 练习中（骨架已就位，待实现） |

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
│   └── test.js          # 随手写的 JS 草稿
├── test/
│   ├── tree.test.ts     # buildTree 的单元测试（vitest）
│   └── subtree.test.ts  # collectSubtreeIds 的单元测试（vitest）
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
npx vitest run test/subtree.test.ts
```

> 注：`test/tree.test.ts` 里保留了一个我自己的 `amiNos` 占位用例（`expect(1+1).toBe(3)`），
> 目前是**红灯**状态，属于练手时留下的自定义测试，不影响 `buildTree` 的其余用例。
> `test/subtree.test.ts` 的 11 个用例在实现 `collectSubtreeIds` 之前也全是红的 —— 这是练习的起点，不是 bug。

## 学习路线

- [x] **Day 1** —— 扁平数组 → 文档树（`buildTree`，O(n) 两遍扫描）
- [ ] **Day 2** —— 一次算出整棵子树（`collectSubtreeIds`，BFS + 防环），骨架与用例已就位，待实现
- [ ] 待续……

## 参考

- **Lotion** —— 全栈 AI 笔记应用（无限层级文档树 + BlockNote + DeepSeek Agent），本仓库的练习原型
- Lotion 中对应实现：`lib/db.ts` 的 `getSidebarAll()` / `archive()` / `restore()`、`document-list.tsx` 的递归树渲染
