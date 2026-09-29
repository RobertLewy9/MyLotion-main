# MyLotion

> 照着 Lotion 一天一个模块，亲手复刻 AI 笔记应用的核心逻辑。

Lotion 是一个全栈 AI 笔记应用：无限层级文档树、BlockNote 富文本编辑、DeepSeek Agent 自主增删改查笔记。
本仓库 **不是** Lotion 的分支或复制品，而是我把它的关键代码拆成一日一题、自己动手实现的练习场 —— 重点是**想清楚复杂度、写干净的函数、用测试验证行为**，而不是照抄。

## 当前进度

| Day | 主题 | 状态 |
|-----|------|------|
| Day 1 | 扁平数组还原成文档树（`buildTree`） | ✅ 已完成 |

## 这是什么

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
│   └── test.js          # 随手写的 JS 草稿
├── test/
│   └── tree.test.ts     # buildTree 的单元测试（vitest）
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
```

> 注：`test/tree.test.ts` 里保留了一个我自己的 `amiNos` 占位用例（`expect(1+1).toBe(3)`），
> 目前是**红灯**状态，属于练手时留下的自定义测试，不影响 `buildTree` 的其余用例。

## 学习路线

- [x] **Day 1** —— 扁平数组 → 文档树（`buildTree`，O(n) 两遍扫描）
- [ ] 待续……

## 参考

- **Lotion** —— 全栈 AI 笔记应用（无限层级文档树 + BlockNote + DeepSeek Agent），本仓库的练习原型
- Lotion 中对应实现：`lib/db.ts` 的 `getSidebarAll()`、`document-list.tsx` 的递归树渲染
