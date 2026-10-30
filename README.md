# MyLotion

> 照着 Lotion 逐块拆解，把 AI 笔记应用的核心机制用可测试的纯 TS 复刻一遍 —— 目标是**讲清楚**，不是背代码。

Lotion 是一个全栈 AI 笔记应用：无限层级文档树、BlockNote 富文本编辑、DeepSeek Agent 自主增删改查笔记。
本仓库 **不是** Lotion 的分支或复制品，而是我把它的关键机制拆成「一天一块」、亲手复刻的靶场。
代码由 AI 产出，我负责**读懂 → 讲清楚 → 扛住追问**。

## 学习策略：四轨并行

> 文件怎么找：命名统一为 `dayNN-<轨>-<主题>`，**所有文件 × Day × 轨 的总表见 `docs/00-文件索引.md`**。

| 轨 | 做什么 | 产出 |
|----|--------|------|
| **A · MyLotion** | 读实现 / 架构 → 理解流程 → 写讲稿 → 被追问 | `docs/讲稿/dayNN-*.md` |
| **B · 八股（单轨交替）** | 单日 B1 前端 / 双日 B2 Agent，每次 **3 题 + 1 题项目落地**，开口讲不默读 | `docs/B1-前端八股考点.md` / `docs/B2-Agent八股考点.md` 打勾 + 题纸 |
| **C · 力扣手撕** | 每天 2 题，限时 20 分钟/题 + 跑测试 | `docs/C-力扣Hot100题单.md` 打勾 + `src/interview/*.ts` |
| **✱ 简历对齐** | A 轨末尾挑简历上的一条词，用「① 干什么 ② 完整流程 ③ 为什么选它」讲 2 分钟 | `docs/全轨-简历映射.md` 打勾 + 卡壳记日志 |

- **依据一**：8 场大厂实习面经（B站 / CSIG / IEG / 快手 / 携程 / 腾讯云智）。考点分布：八股 ~60%、项目深挖 ~30%、手撕 ~10%。
- **依据二**：在腾讯做 Agent 开发实习的朋友 ——「重点就是你把项目吃透。他只会看着你简历问呀。你所有涉及到的每一个技术栈、中间件，在你项目里怎么用、流程怎么样，都得吃透。然后 agent 开发就是 agent 八股。」
- **简历即考纲**：面试官只看着简历问，所以准备单位是「简历上的一个词」而非知识点。逐词映射表（在我项目里 / 会被追什么 / 对应材料 Day）见 `docs/全轨-简历映射.md`；写了却讲不出的词，**要么补上、要么从简历删掉**。
- **时间轴**：Day 8 = 2026-10-29 → Day 48 = 2026-12-03（45 天是节奏目标，不是每天满配的配额），排期见 `docs/00-学习计划.md`。
- **难度校准**：Day 4–7 已按 8 份面经重新筛选，超纲的 tick 推演、curry 实现、bind polyfill、Prompt 大专题已移出必做；依据见 docs/00-Day4-7-面经校准.md。
- **讲稿是版本递进的**：v1 认地图 → 每个阶段复盘升一版 → Day 42 全链路终稿。

## 当前进度

| Day | 主题 | 状态 |
|-----|------|------|
| Day 1 | 扁平数组还原成文档树（`buildTree`） | ✅ |
| Day 2 | 一次算出整棵子树（`collectSubtreeIds`） | ✅ |
| Day 3 | 文档提及解析（`extractMentions` / `truncateMentionTitle`） | ✅ |
| Day 4 | 认地图 + 事件循环（B1）+ 手撕 01（C） | ✅ |
| Day 5 | 画架构图 + async/await（B1）+ LLM 基础（B2）+ Hot 100 开篇（C） | 🔄 A/B ✅，C 待补 |
| Day 6 | 数据层取数模块（A）+ 闭包（B1）+ Agent 词汇与 Tool Calling（B2）+ 两道题解（C） | 🔄 |
| Day 7 | 全量建树 / 懒加载模块（A）+ 箭头函数与 this（B1）+ 清 C 轨欠账 | 🔄 |
| Day 8 | 文档详情缓存（A）+ 原型链与继承（B1）+ 最长子串 / 接雨水（C） | 🔄 材料就绪 |

手撕轨：**C 轨主线已拆成两部分** —— 力扣 Hot 100（`docs/C-力扣Hot100题单.md`，每天 2 题）+ 面经真题（前端手撕类，Hot 100 覆盖不到的）。
已完成：01 `EventEmitter`（12/12 用例），题解见 `docs/讲稿/day04-C-手撕01-EventEmitter.md`。
**C 轨暂停上新**：`two-sum`、`group-anagrams`、`longest-consecutive`、`move-zeroes` 四道欠账清零前不加新题（用例仍是红的，写完就绿）。Day 8 的 `longest-substring` / `trap-rain-water` 已排进下一项，欠账清零后再开。

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

产出：`docs/讲稿/day04-A-架构通读.md`（v1，60 秒口述稿）。
完整版见 `docs/A-架构总览.md`。

### C 轨 · 手撕 01 —— EventEmitter

IEG 一面题。核心是一张 `Map<事件名, 监听器数组>`，三个细节是追问点：

- **`once` 用包装函数**：触发时先 `off` 自己、再调原函数（先摘再跑）。反过来写，原函数里再 `emit` 同一事件就会递归重入
- **包装函数上挂 `listener` 指回原函数**：这样 `off(event, 原函数)` 也能移除 once 注册过的监听器（对齐 Node 行为）
- **`emit` 遍历 `[...list]` 快照**：本轮触发哪些监听器，在开始时定死；否则回调里新 `on` 的监听器会在本轮就被调用

另外 `off` 移除后若该事件已无监听器，要把 key 一起 `delete`，否则 `Map` 会随动态事件名无限增长。

> 注意：上面两条语义（快照、先摘再跑）**原来的 10 条用例全都盖不住** —— 把快照去掉、或把 `off` 挪到 `fn` 之后，
> 测试依然全绿。已补 2 条用例把它们钉住。

题解与追问预判见 `docs/讲稿/day04-C-手撕01-EventEmitter.md`。

### B 轨 · 事件循环（面经校准版）

B站 / CSIG / 腾讯云智一面确实问，但实际深度是：**同步代码跑完 → 清空微任务 → 取一个宏任务**，
再加一道输出题。当前题纸只保留 **4 概念 + 4 输出 + 1 项目场景**，约 20 分钟。

保留的四个判断点：

- Promise 回调是微任务，`setTimeout` 是宏任务；
- `new Promise(executor)` 的 executor 同步执行；
- `async` 函数同步跑到第一个 `await`，后面的续体是微任务；
- 一个微任务里新排的任务进队尾，要等本轮已排队的微任务跑完。

题纸与答案见 `docs/八股/day04-B1-事件循环-题目.md` / `答案.md`。
`process.nextTick` 与 Promise 的先后、thenable 多 tick、4ms 定时器饥饿、React 18 批处理不在本轮 8 场面经的追问范围里，已移出必做。

## 技术栈

- **TypeScript**（`strict` 模式，`noEmit`，仅做类型检查）
- **Vitest** 4 —— 单元测试与 watch 模式
- **pnpm** —— 包管理（仓库内含 `pnpm-lock.yaml`）
- 路径别名 `@/*` 指向仓库根目录

## 目录结构

> 命名规则：`dayNN-<轨>-<主题>`；**轨 = A（MyLotion）/ B1（前端八股）/ B2（Agent 八股）/ C（力扣手撕）**。
> 全时段文档用 `00-`（元文档）、`全轨-`（跨轨）或直接以轨名开头。完整对照表见 `docs/00-文件索引.md`。

```
MyLotion-main/
├── src/
│   ├── tree.ts                     # Day 1 · A 轨：buildTree
│   ├── subtree.ts                  # Day 2 · A 轨：collectSubtreeIds
│   ├── mention.ts                  # Day 3 · A 轨：extractMentions / truncateMentionTitle
│   ├── data/
│   │   ├── documents.ts            # Day 6 · A 轨：selectSidebarRows / indexByParent（12 用例 ✅）
│   │   ├── sidebar.ts              # Day 7 · A 轨：getSidebarTree / getChildren / createSidebarIndex（10 用例 ✅）
│   │   └── document-cache.ts       # Day 8 · A 轨：并发去重 + LRU 200（13 用例 ✅）
│   ├── interview/                  # C 轨：力扣 Hot 100 / 手撕
│   │   ├── event-emitter.ts        # Day 4 · 手撕 01（12/12 ✅）
│   │   ├── two-sum.ts              # Day 5 · 待实现
│   │   ├── group-anagrams.ts       # Day 5 · 待实现
│   │   ├── longest-consecutive.ts  # Day 6 · 待实现
│   │   ├── move-zeroes.ts          # Day 6 · 待实现
│   │   ├── longest-substring.ts    # Day 8 · 待实现
│   │   └── trap-rain-water.ts      # Day 8 · 待实现
│   └── test.js                     # 随手写的 JS 草稿
├── test/
│   ├── tree.test.ts                # Day 1 · A
│   ├── subtree.test.ts             # Day 2 · A
│   ├── mention.test.ts             # Day 3 · A
│   ├── data/
│   │   ├── documents.test.ts       # Day 6 · A（12 用例 ✅）
│   │   ├── sidebar.test.ts         # Day 7 · A（10 用例 ✅）
│   │   └── document-cache.test.ts  # Day 8 · A（13 用例 ✅）
│   └── interview/                  # Day 4~8 · C
│       ├── event-emitter.test.ts
│       ├── two-sum.test.ts
│       ├── group-anagrams.test.ts
│       ├── longest-consecutive.test.ts
│       ├── move-zeroes.test.ts
│       ├── longest-substring.test.ts
│       └── trap-rain-water.test.ts
├── docs/
│   ├── 00-文件索引.md              # ★ 所有文件 × Day × 轨 的总表
│   ├── 00-学习策略.md              # 为什么这么学（8 场面经 + 简历即考纲）
│   ├── 00-学习计划.md              # 45 天四轨日历 + 节奏规则 + 完善路线
│   ├── A-架构总览.md               # A 轨主线：三层 / 主链路 / 边界与演进
│   ├── 全轨-简历映射.md            # 简历上的词 → 项目角色 → 会被追问什么
│   ├── B1-前端八股考点.md          # B1 清单 + STAR 故事库 + 反问清单
│   ├── B2-Agent八股考点.md         # B2 清单（LLM / Prompt / Agent / Tool / MCP / RAG）
│   ├── C-力扣Hot100题单.md         # C 轨题单 + 打卡
│   ├── 讲稿/                        # A 轨讲稿（day04-C 为 C 轨题解）
│   │   ├── _模板.md
│   │   ├── day01-A-示例-buildTree.md
│   │   ├── day04-A-架构通读.md
│   │   ├── day04-C-手撕01-EventEmitter.md
│   │   ├── day05-A-架构自绘.md
│   │   ├── day06-A-数据层.md
│   │   ├── day07-A-全量拉取与懒加载.md
│   │   ├── day08-A-请求去重与内存缓存.md
│   │   ├── day06-C-最长连续序列.md
│   │   ├── day06-C-移动零.md
│   │   ├── day08-C-无重复字符的最长子串.md
│   │   ├── day08-C-接雨水.md
│   │   └── 术语人话版.md           # 全轨通用
│   ├── 八股/                        # B1 / B2 题纸与答案
│   │   ├── day04-B1-事件循环-题目.md / 答案.md
│   │   ├── day05-B1-输出题与async形态-题目.md / 答案.md
│   │   ├── day05-B2-LLM基础-题目.md / 答案.md
│   │   ├── day06-B1-闭包-题目.md / 答案.md
│   │   ├── day06-B2-Agent核心-题目.md / 答案.md
│   │   ├── day07-B1-this与call-apply-bind-题目.md / 答案.md
│   │   └── day08-B1-原型链与继承-题目.md / 答案.md
│   ├── 速记/
│   │   ├── day05-A-速记.md
│   │   └── day05-A-速记-qq版.txt
│   └── 日志/
│       ├── day04-全轨-日志.md
│       ├── day05-全轨-日志.md
│       ├── day06-全轨-日志.md
│       ├── day07-全轨-日志.md
│       └── day08-全轨-日志.md
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

> 注：Day 8 的 A 轨缓存新增 13 个绿色用例；C 轨 `two-sum` / `group-anagrams` / `longest-consecutive` / `move-zeroes` 以及 Day 8 两道新题仍是**待实现**，红色属预期 —— 写完就绿。

## 学习路线

- [x] **Day 1** —— 扁平数组 → 文档树（`buildTree`，O(n) 两遍扫描）
- [x] **Day 2** —— 一次算出整棵子树（`collectSubtreeIds`，BFS + 防环）
- [x] **Day 3** —— 文档提及解析（`extractMentions` / `truncateMentionTitle`）
- [x] **Day 4** —— 认地图：三层结构 + 主链路 + 讲稿 v1；B1 事件循环（4 概念 + 4 输出）；C 手撕 01 `EventEmitter`
- [ ] **Day 5** —— 自己画架构图 + 主链路；B1 `async/await`；B2 LLM 基础（Token / 上下文 / 无状态 / 压缩）；C Hot 100 开篇（两数之和 / 字母异位词分组）
- [ ] **Day 5-42** —— 逐块点亮（数据层 → 前端 → 实时协同 → AI 链路 → 权限/工程化），每阶段复盘时讲稿升一版
- [ ] **Day 43-48** —— 模拟冲刺：5 场模拟面试 + 讲稿定稿

> 完整排期与每日任务见 `docs/00-学习计划.md`。

## 参考

- **Lotion** —— 全栈 AI 笔记应用（无限层级文档树 + BlockNote + DeepSeek Agent），本仓库的练习原型
- Lotion 中对应实现：`lib/db.ts` 的 `getSidebarAll()` / `archive()` / `restore()`、`lib/mention.ts`、`lib/agent.ts`、`lib/compress.ts`、`document-list.tsx` 的递归树渲染
