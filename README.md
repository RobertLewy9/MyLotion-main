# MyLotion

> 照着 Lotion 逐块拆解，把 AI 笔记应用的核心机制用可测试的纯 TS 复刻一遍 —— 目标是**讲清楚**，不是背代码。

Lotion 是一个全栈 AI 笔记应用：无限层级文档树、BlockNote 富文本编辑、DeepSeek Agent 自主增删改查笔记。
本仓库 **不是** Lotion 的分支或复制品，而是我把它的关键机制拆成「一天一块」、亲手复刻的靶场。
代码由 AI 产出，我负责**读懂 → 讲清楚 → 扛住追问**。

## 学习策略：三轨并行

| 轨 | 做什么 | 产出 |
|----|--------|------|
| **A · MyLotion** | 读实现 / 架构 → 理解流程 → 写讲稿 → 被追问 | `docs/讲稿/dayNN-*.md` |
| **B · 八股** | 按考点清单**开口讲**（不默读） | `docs/面经考点.md` 打勾 |
| **C · 手撕** | 限时 20 分钟手写高频题 + 跑测试 | `src/interview/*.ts` |

- **依据**：8 场大厂实习面经（B站 / CSIG / IEG / 快手 / 携程 / 腾讯云智）。考点分布：八股 ~60%、项目深挖 ~30%、手撕 ~10%。
- **时间轴**：45 天（Day 4 ~ Day 48），日历见 `docs/学习计划.md`。
- **讲稿是版本递进的**：v1 认地图 → 每个阶段复盘升一版 → Day 42 全链路终稿。

## 当前进度

| Day | 主题 | 状态 |
|-----|------|------|
| Day 1 | 扁平数组还原成文档树（`buildTree`） | ✅ |
| Day 2 | 一次算出整棵子树（`collectSubtreeIds`） | ✅ |
| Day 3 | 文档提及解析（`extractMentions` / `truncateMentionTitle`） | ✅ |
| Day 4 | 认地图：Lotion 整套流程 + 讲稿 v1 | ✅ |

手撕轨：`EventEmitter` 脚手架 + 10 个用例已就位，待实现。

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

AI 面板的胶囊输入框选中文档后，会把它序列化成标记文本，随 prompt 一起发给服务端：

```
[@季度总结](9f8c1e2a)
```

**注意：服务端主链路并不解析这段文本** —— 而是靠系统提示词约定
「看到 `[@标题](id)` 就直接用其中的 id 调 `readNote`」，由**模型自己识别**。

`lib/mention.ts` 的价值是把这套协议收敛成可复用的纯函数：
`truncateMentionTitle` 前端渲染胶囊时在用；`extractMentions` 目前没有生产调用方（只有单测）。

覆盖的规则：

1. `extractMentions(text)`：匹配 `[@标题](id)`，标题不含 `]`、id 为字母/数字/连字符且长度 3~64
2. 按出现顺序返回；标题去首尾空白，空标题跳过；同一 id 只保留首次出现
3. `truncateMentionTitle(title, maxChars = 4)`：先 trim，超长则截断并补 `…`
4. 纯函数、可重复调用（注意带 `g` 的正则 `lastIndex` 是有状态的）

## Day 4 —— 认地图

不求讲通细节，先给自己一个坐标系：这套系统**有哪几块、各干什么、怎么串**。

- **三层**：前端（侧边栏树 / BlockNote 编辑器 / AI 面板）→ API + Agent（鉴权、上下文、模型与工具调用）→ 数据层（单表自引用 + RLS）
- **主链路**：用户输入 → 前端 POST `/api/ai/chat` → 鉴权 / 幂等落库 / 拉历史 → `streamText` 驱动 Agent → 调用工具改库 → `onEvent` 上报副作用 → SSE 推回前端 → 前端按 `type` 分发（渲染文本 / 显示进度 / 跳转刷新 / 弹确认框）
- **关键前提**：工具跑在**服务端**，前端看不见它的内部执行，所以副作用必须显式上报

产出：`docs/讲稿/day04-架构通读.md`（v1，60 秒口述稿）。
完整版见 `docs/架构总览.md`。

## 技术栈

- **TypeScript**（`strict` 模式，`noEmit`，仅做类型检查）
- **Vitest** 4 —— 单元测试与 watch 模式
- **pnpm** —— 包管理（仓库内含 `pnpm-lock.yaml`）
- 路径别名 `@/*` 指向仓库根目录

## 目录结构

```
MyLotion-main/
├── src/
│   ├── tree.ts                 # Day 1：buildTree —— 扁平数组还原成文档树
│   ├── subtree.ts              # Day 2：collectSubtreeIds —— 一次算出整棵子树
│   ├── mention.ts              # Day 3：extractMentions / truncateMentionTitle —— @提及解析
│   ├── interview/
│   │   └── event-emitter.ts    # 手撕 01：EventEmitter（待实现）
│   └── test.js                 # 随手写的 JS 草稿
├── test/
│   ├── tree.test.ts
│   ├── subtree.test.ts
│   ├── mention.test.ts
│   └── interview/
│       └── event-emitter.test.ts
├── docs/
│   ├── 学习策略.md              # 为什么这么学（依据 8 场面经）
│   ├── 学习计划.md              # 45 天三轨日历 + 讲稿版本机制 + 完善路线
│   ├── 架构总览.md              # Lotion 端到端全流程 + 边界与演进
│   ├── 面经考点.md              # 考点清单 + STAR 故事库 + 反问清单
│   └── 讲稿/
│       ├── _模板.md
│       ├── 示例-day01-buildTree.md
│       └── day04-架构通读.md    # Day 4 讲稿 v1
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

## 快速开始

### 前置要求

- Node.js 18+
- pnpm

### 安装与测试

```bash
# 1. 安装依赖
pnpm install

# 2. 运行全部测试
pnpm test

# 3. watch 模式
pnpm test:watch

# 4. 只跑手撕题库的用例
npx vitest run test/interview/
```

> 注：Day 1~3 的 38 个用例全绿；`test/interview/event-emitter.test.ts` 的 10 个用例是**手撕起点**，
> 实现前保持红色。

## 学习路线

- [x] **Day 1** —— 扁平数组 → 文档树（`buildTree`，O(n) 两遍扫描）
- [x] **Day 2** —— 一次算出整棵子树（`collectSubtreeIds`，BFS + 防环）
- [x] **Day 3** —— 文档提及解析（`extractMentions` / `truncateMentionTitle`）
- [x] **Day 4** —— 认地图：三层结构 + 主链路 + 讲稿 v1
- [ ] **Day 5-42** —— 逐块点亮（数据层 → 前端 → 实时协同 → AI 链路 → 权限/工程化），每阶段复盘时讲稿升一版
- [ ] **Day 43-48** —— 模拟冲刺：5 场模拟面试 + 讲稿定稿

> 完整排期与每日任务见 `docs/学习计划.md`。

## 参考

- **Lotion** —— 全栈 AI 笔记应用（无限层级文档树 + BlockNote + DeepSeek Agent），本仓库的练习原型
- Lotion 中对应实现：`lib/db.ts` 的 `getSidebarAll()` / `archive()` / `restore()`、`lib/mention.ts`、`lib/agent.ts`、`lib/compress.ts`、`document-list.tsx` 的递归树渲染
