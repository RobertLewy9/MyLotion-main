# A 轨参考 · Lotion 架构总览

> **归属：全时段参考（A 轨主线）**
> 目的：能把 Lotion 讲成一条线，并解释关键组件为什么在这里。
> 选型细节见 `docs/学习/A-技术选型总览.md`；Day 10 起不要求逐行读源码。

## 一句话

Lotion 是一个**单机自托管的类 Notion AI 笔记应用**：React SPA 负责交互，Hono 在一个 Node 进程里提供 REST API 和静态资源，SQLite 保存数据，BlockNote 承载块级富文本，DeepSeek Agent 通过 Tool Calling 修改笔记并用 SSE 推送执行过程。

## 技术栈

| 层 | 选型 | 作用 |
|---|---|---|
| 前端 | Vite 8 + React 19 SPA | 构建与页面交互 |
| 路由 | react-router 7 | 页面路由、参数、登录守卫 |
| 样式 | Tailwind CSS 4 + 自研 UI 原语 | 设计 token 与 Apple/macOS 视觉 |
| 状态 | Zustand | 侧边栏、弹窗、AI 面板等 UI 状态 |
| 编辑器 | BlockNote 0.54 | 块级富文本，JSON 无损存储 |
| 后端 | Hono 4 + @hono/node-server | REST API、中间件、静态资源、SPA 回退 |
| 数据库 | SQLite + better-sqlite3 | 单机持久化，WAL，启动自动迁移 |
| 认证 | scrypt + sessions + HttpOnly cookie | 登录、会话与吊销 |
| AI | Vercel AI SDK + DeepSeek | 流式生成、Tool Calling、Agent loop |
| 通信 | SSE | 把文本和工具事件单向推给前端 |
| 扩展 | Cordis 4 + 8 条接缝 | 路由、工具、UI、配置等能力可插拔 |

## 进程与分层

```text
浏览器（React SPA）
┌──────────────────────────────────────────────┐
│ react-router 7       页面与路由守卫          │
│ Zustand              UI 状态                 │
│ BlockNote            文档编辑，JSON          │
│ docStore 接缝        REST provider           │
│ uiSlots              UI 插槽注册             │
└──────────────────────┬───────────────────────┘
                       │ /api/*，同源 cookie
                       ▼
Node 进程（Hono 4）
┌──────────────────────────────────────────────┐
│ requireAuth          session cookie → user   │
│ 44 个 REST 端点      11 个路由插件            │
│ docStore 接缝        SQLite provider         │
│ settings / tools / httpRoutes / pluginAdmin  │
│ AI SDK + DeepSeek    19 个工具，最多 5 步     │
│ 静态资源 + SPA 回退                          │
└──────────────────────┬───────────────────────┘
                       ▼
data/lotion.db（WAL）、data/uploads/、data/plugins/
```

> 浏览器与宿主进程共用同一份 `lib/kernel` 和 `lib/seams` 契约；内核本身不依赖 Node、React 或数据库。

## 8 条接缝

| 接缝 | 作用 | 宿主侧 | 浏览器侧 |
|---|---|---|---|
| `docStore` | 文档与会话数据访问 | SQLite provider | REST provider |
| `settings` | 默认配置 + 用户配置 | 文件实现 | — |
| `httpRoutes` | 注册 REST 路由 | Hono 组合根 | — |
| `tools` | 注册 AI 工具 | 宿主工具注册表 | — |
| `uiSlots` | 注册 UI 槽位 | — | 客户端插槽表 |
| `remote` | 远程能力边界 | REST 路由 | REST 客户端 |
| `dynamicPlugins` | 动态插件通道 | `node:vm`，默认关闭 | 浏览器动态加载 |
| `pluginAdmin` | 插件启停、配置、市场 | 本地插件管理 | REST 客户端 |

### 为什么要接缝

- 功能不直接互相 import，而是依赖一个稳定契约。
- 同一份契约可以在浏览器和 Node 两端提供不同实现。
- 插件注册的监听器、路由、工具和 UI 都有 disposer，可以卸载。
- 代价是抽象层更多，调试时要理解装配顺序和依赖注入。

> 动态插件通道**不是安全沙箱**，默认关闭；安装、启用、客户端审批是三件事。

## 四条主链路

### 1. 登录

```text
POST /api/auth/login
  → 按邮箱查用户
  → scrypt 校验密码
  → 写入 sessions 表
  → Set-Cookie: HttpOnly + SameSite=Lax
  → 前端请求 /api/me
  → MainLayout 做会话守卫
```

关键点：会话在服务端可吊销；cookie 不暴露给 JavaScript；SQLite 没有 RLS，后续所有查询显式带 `userId`。

### 2. 文档读取与保存

```text
页面 / 侧边栏
  → docStore 接缝
  → REST /api/documents/*
  → requireAuth 得到 userId
  → SQLite 显式按 userId 查询
  → 返回文档树 / 文档内容
  → BlockNote 编辑
  → 保存 BlockNote JSON
```

关键点：UI 不直接访问数据库；浏览器不直接写 SQL；`documents.parentDocument` 自引用支持无限层级；侧边栏可一次取回扁平数据后在内存建树。

### 3. AI 改笔记

```text
AI 面板 POST /api/ai/chat
  → requireAuth + 会话归属校验
  → requestId 命中唯一约束则 409（幂等）
  → 读取最近历史 + 会话摘要
  → streamText(DeepSeek, tools, stopWhen: 5 步)
  → 模型选择工具
  → 工具在服务端执行，经 onEvent 上报副作用
  → agent 聚合为 SSE 事件
  → 前端按 \n\n 解析
  → 刷新文档 / 弹确认框 / 展示工具卡
  → 本轮结束，必要时压缩历史
```

关键点：模型只能发起操作，服务端工具才有执行权；危险删除/移动需要用户确认；隐式写入进入 `ai_changes`，支持撤销。

### 4. 插件启停

```text
pluginAdmin 接缝
  → 读取插件清单与配置
  → Cordis 挂载 / 卸载插件
  → 插件注册 routes / tools / uiSlots
  → 卸载时执行 disposer
```

关键点：宿主插件可以实时启停；UI 插件通常需要刷新页面；动态插件默认关闭。

## 数据模型

SQLite 当前 6 张核心表：

| 表 | 作用 |
|---|---|
| `users` | 账号、密码哈希 |
| `sessions` | 登录会话，可吊销 |
| `documents` | 文档、`parentDocument` 自引用、内容 JSON、发布/归档状态 |
| `chat_sessions` | AI 会话，可绑定文档 |
| `chat_messages` | 消息、`requestId`、回合快照 metadata |
| `ai_changes` | AI 隐式写入前的快照，用于撤销 |

数据库文件：`data/lotion.db`，WAL 模式，启动自动执行迁移；上传文件在 `data/uploads/`。

## 关键取舍

| 决策 | 选择理由 | 代价 / 何时换 |
|---|---|---|
| Vite + React SPA | 登录后工具型产品，不需要 SSR/SEO；单机部署简单 | 首屏无服务端注入；公开内容站再考虑 Next |
| Hono 单进程 | API、静态资源、SQLite 同机，运维最省 | 多实例、团队变大再拆服务 |
| SQLite | 零外部服务、文件即数据库、WAL | 无 RLS、无跨机写入；规模上来换 PostgreSQL/libSQL |
| Session cookie | 可吊销、HttpOnly、安全 | 多服务/多端再考虑 JWT 或统一身份平台 |
| BlockNote JSON | 保留块 ID 和结构，适合 AI 精确修改 | 协作和超大文档再考虑 CRDT/分块 |
| SSE | AI 单向流，HTTP 原生、代理友好 | 双向协同换 WebSocket |
| 有界 Agent loop | 最多 5 步，成本与失控风险可控 | 长任务再引入队列、持久化与更复杂编排 |
| Cordis 插件化 | 能力可注册、可卸载，核心耦合低 | 抽象成本高；无扩展需求时普通模块化更直接 |

## 边界题怎么答

### 单篇文档无限写入

| 层 | 当前瓶颈 | 演进 |
|---|---|---|
| 存储 | 整篇 BlockNote JSON 在一个字段 | 按 block 拆表 / CRDT 增量 |
| 网络 | 保存时可能发送整篇 JSON | 增量 diff，只传变化块 |
| 视图 | 大量 DOM 节点导致掉帧 | 块级虚拟化，只渲染视口 |
| 产品 | 技术不能无限兜底 | Block 数阈值提示、拆子文档 |

### 海量文档 / 深树

邻接表适合当前规模；层级极深或子树查询频繁时，考虑闭包表、路径枚举或物化路径。

### 多实例部署

SQLite 文件和本地图片不适合多实例同时写；先把数据库换远程 libSQL/PostgreSQL、上传换对象存储，再拆 API 和前端。

### 安全边界

- 所有受保护 API 挂 `requireAuth`。
- 所有本地查询显式带 `userId`，不能依赖不存在的 RLS。
- 动态插件不是沙箱，默认关闭。
- 上传要校验类型和大小；公网部署要补 CSP、限流和分享令牌。

## A 轨用法

1. 先背“一句话”和技术栈表。
2. 按 `docs/学习/00-学习计划.md` 每天只攻一个选型。
3. 用 `docs/学习/A-技术选型总览.md` 的五问卡回答，不读业务函数细节。
4. 复盘日把四条主链路各讲 1 分钟。

> 面试时的总述顺序：**产品定位 → 技术栈 → 一条主链路 → 一个关键取舍 → 一个边界演进。**
