# A 轨总纲 · Lotion 技术选型（Day 10 起）

> **归属：全时段参考（A 轨主线）**
> 目标不是背源码，而是回答面试官真正会追问的五件事：
> **它是什么 → 在项目里承担什么 → 为什么选它 → 替代方案是什么 → 什么情况下应该换掉它。**

## 0. 先背项目定位（60 秒）

Lotion 是一个**单机自托管的类 Notion AI 笔记应用**：React SPA 负责交互，Hono 在一个 Node 进程里同时提供 REST API 和静态资源，SQLite 保存文档与会话，BlockNote 承载块级富文本，DeepSeek Agent 通过 Tool Calling 修改笔记，并用 SSE 把执行过程推给前端。项目还做了 Cordis 插件内核和 8 条接缝，让路由、工具、UI 槽位等能力可以注册和卸载。

## 1. A 轨的答题卡

每个选型都按同一张卡准备，**只写关键词，不写实现细节**：

| 问题 | 30 秒内要说什么 | 例子（Vite / React SPA） |
|---|---|---|
| 它是什么 | 一句话定位 | 纯前端 SPA，构建后由 Hono 托管静态文件 |
| 在项目里干什么 | 入口和边界 | 页面路由、编辑器、AI 面板都在浏览器里运行 |
| 为什么选它 | 由项目约束反推 | 单机自托管、不需要 SSR/SEO，Next 的差异化能力没被使用 |
| 替代方案 | 至少两个，并说代价 | Next.js：有 SSR/RSC，但更重，还会和 SQLite 原生命令、单机部署产生摩擦 |
| 何时换掉 | 明确触发条件 | 需要 SEO、服务端渲染、边缘部署或大量后端驱动页面时换 Next |

> 面试时不要从“Vite 很快”开始。先说**项目约束**，再说选型——这样才像做过决策，而不是背官网文案。

## 2. 核心选型总表

| 场景 | Lotion 的选型 | 作用 | 为什么选它 | 主要替代方案 | 什么时候该换 |
|---|---|---|---|---|---|
| 前端框架 | Vite 8 + React 19 SPA | 构建与交互层 | 项目是单机自托管的后台型产品，不需要 SSR/RSC；Vite 配置少、启动和构建快 | Next.js、Remix、Vue | 公开内容站、强 SEO、服务端渲染、边缘部署 |
| 路由 | react-router 7 | 客户端页面路由、参数、守卫 | 纯 SPA 足够；与 React 生态直接配合 | TanStack Router、Next 文件路由 | 需要强类型文件路由或框架级数据加载约定 |
| 样式 | Tailwind CSS 4 + 自研 UI 原语 | 设计 token、布局、交互组件 | 小团队定制视觉快，避免组件库默认风格；设计语言统一为 Apple/macOS | shadcn/ui、MUI、Ant Design | 需要大量复杂表格、后台模板或成熟无障碍组件 |
| 状态 | Zustand | 侧边栏、弹窗、AI 面板等跨组件 UI 状态 | API 小、无需 Provider、selector 可减少无关重渲染 | Redux Toolkit、React Context、Jotai | 状态机复杂、需要时间旅行调试、多人协作的大型前端 |
| 编辑器 | BlockNote 0.54 | 块级富文本编辑 | 开箱 UI 完整，底层 ProseMirror，块模型适合笔记；JSON 可无损保存 | Tiptap、Lexical、Slate | 需要深度定制交互、极致性能或完全自控的编辑模型 |
| 内容存储 | BlockNote JSON；服务端转 Markdown | 编辑器数据与导出 | JSON 保留块 ID 和结构；Markdown 适合导出、兼容旧数据 | 直接存 Markdown、存 HTML、按 block 拆表 | 需要多人增量同步、块级版本或跨端协同时再引入 CRDT/分块 |
| 后端框架 | Hono 4 + @hono/node-server | REST API、中间件、静态资源 | 轻量、类型友好、可在 Node 直接运行；单进程同时托管 API 和前端 | Express、Fastify、NestJS | 团队需要强 DI/模块规范，或接口规模和组织复杂度显著上升 |
| API 风格 | REST | 文档、会话、插件、上传等资源接口 | 资源边界清楚，浏览器 fetch 简单，调试成本低 | GraphQL、tRPC | 多客户端需要灵活查询，或前后端全 TypeScript 且追求端到端类型 |
| 数据库 | SQLite + better-sqlite3 | 单机持久化 | 零外部服务、同步 API 简单、WAL 支持并发读写；与单机自托管定位匹配 | PostgreSQL、Supabase、Turso/libSQL | 多实例、Serverless、跨机器写入、需要数据库级权限 |
| 数据模型 | `documents` 单表自引用 + 索引 | 无限层级文档树 | 邻接表简单，侧边栏一次取回后在内存建树 | 闭包表、路径枚举、嵌套集 | 层级极深、子树查询频繁、数据量远超单机内存 |
| 认证 | scrypt + sessions 表 + HttpOnly cookie | 注册、登录、会话吊销 | 不引入第三方；会话可撤销；cookie 不由 JS 读取 | JWT、Better Auth、Clerk、OAuth | 需要第三方登录、多端 token、MFA、组织权限 |
| 授权 | 应用层显式 `userId` 过滤 | 隔离用户数据 | SQLite 没有 RLS；所有查询统一带用户条件，逻辑集中 | PostgreSQL RLS、Supabase Policy | 数据访问点分散、多人协作或合规要求提高时，改用数据库级策略 |
| AI 接入 | Vercel AI SDK + DeepSeek | 模型调用、流式输出、Tool Calling | SDK 统一流式与工具协议，避免自己拼底层请求；DeepSeek 成本低 | LangChain、OpenAI SDK、直接 HTTP | 需要复杂多 Agent 编排、评测平台或特定供应商能力 |
| Agent 形态 | `streamText` + Tool Calling + 最多 5 步 | 让模型查询和修改笔记 | 有界循环，成本和失控风险可控；工具结果可结构化回传 | 单次问答、固定工作流、无限自治 Agent | 流程高度确定时改工作流；需要长任务时再引入队列与持久化 |
| 流式协议 | SSE | 单向推送文本和工具事件 | 基于 HTTP、代理友好、实现简单；AI 输出本来就是单向 | WebSocket、WebTransport、长轮询 | 需要双向实时协同、低延迟二进制或多人编辑 |
| 扩展机制 | Cordis 插件内核 + 8 条接缝 | 路由、工具、UI、配置等能力可插拔 | 把“功能模块”变成可注册/卸载的能力，降低核心耦合 | 单体模块、事件总线、依赖注入 | 项目不需要第三方扩展时，插件化会增加理解成本 |
| 文件上传 | 本地磁盘 `data/uploads/` | 图片存储与访问 | 单机版无需云账号，路径和权限简单 | S3、Cloudflare R2、OSS | 多实例、CDN、大文件、备份和访问控制要求提高 |

## 3. 八组最容易被追问的对比

### 3.1 Vite + React SPA vs Next.js

- **为什么不是 Next**：项目的 SSR/RSC、ISR、Server Actions、Vercel 部署能力基本没用上；部署形态是单机 SQLite + 本地文件，Next 的 Serverless 优势反而不匹配。
- **Vite 得到什么**：更轻的构建链、快速 HMR、前端与 Hono 边界清楚。
- **付出什么**：没有 SSR/SEO；首屏用户信息要客户端请求 `/api/me`；静态资源回退要自己处理。
- **什么时候换**：营销页和公开文档需要 SEO、需要服务端渲染，或要部署到边缘/Serverless。

### 3.2 Hono vs Express / Fastify / NestJS

- **为什么选 Hono**：轻量、类型友好、Web 标准 Request/Response，Node 适配简单；同一个进程还能托管 `dist/` 和 `public/`。
- **不是 Express 的原因**：不是不能用，而是 Hono 的更小、更现代，类型和中间件组合更顺手。
- **不是 NestJS 的原因**：这个项目没有大型团队和强模块规范需求，Nest 的 DI/装饰器成本偏高。
- **什么时候换**：接口和团队规模明显变大，需要强约定、模块化、依赖注入和统一治理。

### 3.3 SQLite vs PostgreSQL / Supabase

- **为什么选 SQLite**：单机自托管、零运维、文件即数据库；better-sqlite3 同步 API 让事务和数据访问直观；WAL 改善读写并发。
- **代价**：没有 RLS、没有网络多实例写入、备份和迁移要自己做；所有查询必须显式带 `userId`。
- **为什么不用 Supabase**：会把认证、数据库、实时能力交给外部平台，和“本地优先、单机可控”的定位冲突；也会引入网络依赖和另一套权限模型。
- **什么时候换**：公网多实例、Serverless、团队协作、需要数据库级权限或更大数据量时，换 PostgreSQL/Turso 等。

### 3.4 自研 Session vs JWT

- **为什么选 Session**：服务端可立即吊销；token 不暴露给 JS；HttpOnly + SameSite cookie 降低 XSS 窃取风险；实现量小。
- **JWT 的优势**：无状态、跨服务方便；但吊销、黑名单、刷新和密钥轮换更复杂。
- **什么时候换**：多服务、多端、跨域 API、第三方登录、MFA 或组织权限。

### 3.5 BlockNote vs Tiptap / Lexical / Slate

- **为什么选 BlockNote**：默认 UI 和块模型完整，适合快速做 Notion 类产品；底层 ProseMirror，生态成熟；JSON 能保留块结构。
- **Tiptap**：更灵活，但更多 UI 和块行为要自己拼。
- **Lexical**：性能和可定制性强，但学习成本、生态和现成块能力要重新评估。
- **Slate**：模型自由度高，但稳定性和工程维护成本更高。
- **什么时候换**：需要深度定制编辑器、协同编辑、超大文档性能或完全掌控渲染时。

### 3.6 存 BlockNote JSON vs 存 Markdown / HTML

- **JSON**：保留块 ID、类型、嵌套和属性，适合编辑器回显与 AI 精确修改。
- **Markdown**：可读、易导出，但会丢块 ID 和部分富文本语义。
- **HTML**：浏览器友好，但结构化修改和安全性更麻烦。
- **项目策略**：规范存储 JSON，服务端按需转 Markdown；旧 Markdown 惰性兼容。
- **什么时候改**：多人增量同步、块级版本、协作冲突时，考虑 CRDT/分块存储。

### 3.7 SSE vs WebSocket

- **为什么 SSE**：AI 输出是服务端到客户端的单向流；HTTP 原生、代理和鉴权简单；断线重连机制成熟。
- **WebSocket 的优势**：双向、低延迟，适合协同编辑、在线状态和客户端持续推送。
- **代价**：SSE 不适合双向高频交互；WebSocket 要自己处理连接、心跳、重连和消息协议。
- **什么时候换**：多人实时编辑、光标同步、双向事件总线。

### 3.8 Cordis 插件内核 vs 普通单体

- **为什么插件化**：把路由、AI 工具、UI 槽位、配置能力拆成可注册/卸载的接缝；功能增删不必改核心调用链。
- **代价**：抽象层更多，调试要理解 fiber、依赖注入和 disposer；小项目容易过度设计。
- **边界**：动态插件通道不是安全沙箱，默认关闭；插件权限和代码审计仍需人负责。
- **什么时候不用**：没有第三方扩展需求、团队很小、功能边界稳定时，普通模块化更直接。

## 4. 主链路上每个组件站在哪

```text
浏览器
  React SPA + react-router
    ├─ Zustand：UI 状态
    ├─ BlockNote：文档编辑，JSON
    └─ docStore 接缝 → REST /api/*
                 │
                 ▼
Node 进程：Hono
  ├─ requireAuth：session cookie → user
  ├─ 路由插件：documents / chat / ai / plugins / upload
  ├─ SQLite：documents / sessions / messages / ai_changes / plugins
  ├─ AI SDK + DeepSeek：streamText + 19 个工具 + 最多 5 步
  └─ SSE：text / tool_start / tool_end / note_modified / turn_end
```

只需要记住：**浏览器不直接碰 SQLite；UI 不直接写 SQL；工具运行在服务端；前端通过 SSE 知道 Agent 做了什么。**

## 5. 高频追问速答

| 追问 | 一句话回答 |
|---|---|
| 为什么不用 Next.js？ | 项目是单机自托管 SPA，Next 的 SSR/RSC/Serverless 能力没被使用，反而增加约束。 |
| 为什么不用 Supabase？ | 本地 SQLite + 自托管是产品定位，Supabase 会把数据和认证放到外部平台。 |
| 为什么不用 JWT？ | 当前只需要同源会话和可吊销登录，HttpOnly session cookie 更简单、更安全。 |
| 为什么不用 WebSocket？ | AI 是单向事件流，SSE 足够；双向协同才需要 WebSocket。 |
| 为什么不用 Redux？ | 项目状态主要是 UI 开关和局部数据，Zustand 更轻，selector 足够控制重渲染。 |
| 为什么不用 Tiptap？ | BlockNote 提供更完整的块编辑 UI 和 Notion 类交互，开发成本更低。 |
| 为什么不用 LangChain？ | 当前只需要模型调用、流式和工具循环，AI SDK 更薄；复杂编排再引入框架。 |
| 为什么不用 PostgreSQL？ | 单机、零运维、文件数据库更匹配；多实例和 RLS 需求出现时再迁移。 |
| 为什么不用 GraphQL？ | REST 的资源边界已足够，浏览器 fetch 和调试更直接。 |
| 为什么要插件化？ | 让路由、工具、UI 变成可插拔能力，降低核心耦合；代价是抽象和调试成本。 |
| 为什么不用向量数据库？ | 当前是个人笔记规模，关键词检索和上下文窗口够用；语义检索需求明确后再上 RAG。 |
| 为什么单进程？ | 单机自托管部署，API、静态资源和 SQLite 同机最省运维；扩展时再拆分。 |

## 6. A 轨学习地图

| 阶段 | Day | 选型主题 |
|---|---|---|
| 全景 | 10-11 | 项目一句话、技术地图、Vite/React SPA vs Next |
| 前端 | 12-18 | react-router、Tailwind/UI、Zustand、BlockNote、内容存储、性能 |
| 后端与数据 | 19-25 | Hono、单进程、REST、SQLite、数据模型、Session、userId 授权 |
| AI 与插件 | 26-35 | AI SDK/DeepSeek、Tool Calling、Agent loop、SSE、上下文压缩、安全、Cordis、插件市场、可靠性 |
| 工程化与边界 | 36-42 | TS/Zod、安全、部署、上传、搜索、并发、全链路复盘 |
| 冲刺 | 43-48 | 模拟面试与选型追问 |

> 每日具体安排见 `docs/学习/00-学习计划.md`；系统结构见 `docs/学习/A-架构总览.md`。
