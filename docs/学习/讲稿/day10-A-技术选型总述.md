# Day 10 · A 轨 —— 项目全景与技术选型总述

> **归属：Day 10 · A 轨（项目技术选型）**
> 今日主攻：用 60 秒讲清 Lotion，用 2 分钟讲清 **Vite + React SPA 为什么替代 Next.js**。
> 今天不读业务函数、不跑测试；只看架构入口和选型理由。
> 总表：`docs/学习/A-技术选型总览.md`；结构：`docs/学习/A-架构总览.md`。

## 一、今天要形成的三个小胜

| 小胜 | 可验证动作 |
|---|---|
| 开场胜 | 合上资料复述 Day 9 的 WeakMap、RAG、前缀和三句话 |
| 主攻胜 | 不看稿，用 2 分钟讲清 Vite/React SPA vs Next.js |
| 迁移胜 | 换一个产品场景：什么时候反而应该选 Next.js |

## 二、项目 60 秒版

Lotion 是一个**单机自托管的类 Notion AI 笔记应用**。

前端是 **Vite 8 + React 19 SPA**，路由用 react-router 7，编辑器用 BlockNote 0.54，UI 状态用 Zustand，样式是 Tailwind CSS 4 加自研 UI 原语。

后端是 **Hono 4 + Node**。一个 Node 进程同时提供 REST API、静态资源和 SPA 回退；数据存在本地 **SQLite**，用 better-sqlite3 访问，开启 WAL，启动时自动迁移。

登录是**自研极简 Auth**：scrypt 哈希密码，sessions 表保存会话，HttpOnly cookie 承载登录态。SQLite 没有 RLS，所以所有数据查询都在应用层显式带 `userId`。

AI 部分是 **Vercel AI SDK + DeepSeek**：`streamText` 驱动 19 个工具，最多走 5 步；后端用 **SSE** 把文本、工具执行和笔记变更实时推给前端。

架构上，项目用 **Cordis 插件内核 + 8 条接缝**，把文档存储、路由、AI 工具、UI 槽位、配置和插件管理拆成可注册、可卸载的能力。

## 三、技术地图

```text
浏览器（React SPA）
├─ react-router 7        页面与路由守卫
├─ Zustand               UI 开关 / 面板状态
├─ BlockNote 0.54        块级富文本，JSON 存储
└─ docStore 接缝         REST /api/*
          │ 同源 cookie
          ▼
Node 进程（Hono 4）
├─ requireAuth          session cookie → user
├─ REST 路由            文档 / 会话 / AI / 上传 / 插件
├─ SQLite               文档、会话、消息、AI 变更、插件
├─ AI SDK + DeepSeek    streamText + 19 工具 + 最多 5 步
└─ SSE                  text / tool / note_modified / turn_end
```

> 只需要先记住职责，不要在这里展开 SQL 或函数细节。

## 四、主攻：Vite + React SPA 为什么不是 Next.js

### 1. 项目约束

1. 产品形态是登录后的工具型应用，不需要公开内容站的 SEO。
2. 部署目标是单机自托管：SQLite 文件、上传文件、Hono 进程都在同一台机器。
3. 页面几乎全是客户端交互，SSR/RSC、ISR、Server Actions 没有成为核心能力。
4. 数据库访问依赖原生模块 `better-sqlite3`，不适合 Edge runtime。

### 2. 选 Vite 得到什么

- 前端构建和 HMR 更直接，配置面更小。
- 前端只负责 SPA，后端边界由 Hono 承担，责任清楚。
- 生产构建产物交给 Hono 托管，单进程即可运行。
- 不需要为了一个本地工具引入 SSR/RSC 的思维模型和部署约束。

### 3. 付出什么代价

- 没有 SSR，公开页面的 SEO 和首屏内容输出弱。
- 用户信息不能由服务端直接注入，要在客户端请求 `/api/me`，因此需要加载态和路由守卫。
- SPA 的静态资源回退、缓存和 404 处理要自己负责。
- 首屏 JavaScript 体积比纯服务端渲染方案更敏感，需要代码分包。

### 4. 为什么 Next.js 在这个项目里不划算

不是 Next.js 不好，而是它的核心卖点和项目约束错位：

| Next.js 能力 | 在 Lotion 里的实际情况 |
|---|---|
| SSR / RSC | 页面主要是登录后的客户端交互，收益有限 |
| ISR / Server Actions | 没有内容增量再生或表单动作的需求 |
| Vercel / Serverless | SQLite 文件和本地图片不适合无状态函数；单机自托管更自然 |
| 文件路由约定 | 路由数量可控，react-router 足够 |
| 边缘运行时 | `better-sqlite3` 原生模块不适合 Edge |

### 5. 什么时候反而应该选 Next.js

- 公开文档、博客、营销页需要 SEO 和服务端渲染。
- 需要 RSC 降低首屏 JS，或需要 Server Actions 简化表单。
- 部署天然在 Vercel/边缘，数据也能放在托管数据库和对象存储。
- 团队已经重度使用 Next，迁移和招聘成本比“更轻”更重要。

## 五、2 分钟口述稿

> Lotion 是单机自托管的 AI 笔记应用，前端是 Vite + React SPA，后端是 Hono，数据在本地 SQLite。  
> 我们最早也考虑过 Next.js，但后来发现项目几乎全是登录后的客户端交互，SSR、RSC、ISR、Server Actions 都没有真正用上；部署又是 SQLite 加本地文件的单机模式，和 Vercel Serverless 不匹配，原生 `better-sqlite3` 在 Edge runtime 里也不合适。  
> 所以最后拆成 Vite SPA 加 Hono 单进程：Vite 负责快速构建和前端交互，Hono 同时提供 REST API、静态资源和 SPA 回退，边界更清楚，部署也更简单。  
> 代价是没有 SSR 和 SEO，用户信息要在客户端通过 `/api/me` 引导，首屏也要注意分包。如果以后做公开内容站，或者需要服务端渲染和边缘部署，我会重新评估 Next.js。

## 六、面试官可能追问

### Q1：SPA 首屏白屏怎么办？

先区分是资源加载慢还是数据请求慢：路由级 `React.lazy` 分包、骨架屏、静态资源缓存、减少首屏依赖；认证信息用独立 loading 态，不要让整个页面等待所有数据。真正需要 SEO 或服务端首屏时再换 SSR。

### Q2：为什么不用 Next.js 的 Route Handler 做后端？

技术上可以，但这样会把数据库、认证和前端框架绑在一起；项目已经有独立 Hono 层，单进程同时托管 API 和静态资源，边界更清楚，也避开了 Next 运行时对原生模块的限制。

### Q3：单进程会不会扛不住？

当前是单机个人工具，瓶颈首先在 SQLite 写入和单篇文档体积，不在 Node 进程数量。真的要多实例时，先把 SQLite 换成远程数据库、上传换对象存储，再拆 API 和前端；不是一上来就上微服务。

### Q4：为什么不用 monorepo / 前后端分离部署？

前后端同源能直接复用 cookie，省掉 CORS 和跨域配置；单仓库单进程对个人项目运维成本最低。团队和多客户端出现后，再按边界拆包和部署。

### Q5：Vite 和 Webpack 的本质区别是什么？

开发阶段 Vite 利用浏览器原生 ESM 按需加载，启动快；生产构建仍会打包。Webpack 生态成熟、配置能力强，但启动和构建通常更重。这个项目没有复杂的历史构建需求，Vite 的收益更直接。

## 七、今天的 A 轨：45 分钟（另 5 分钟开场）

| 时间 | 动作 | 完成标准 |
|---|---|---|
| 0-5 | 复述 Day 9 三个结论 | 不翻资料 |
| 5-18 | 读本文第二到四节 + `docs/学习/A-技术选型总览.md` 的 Vite 行 | 能说出 3 个项目约束 |
| 18-33 | 填一张选型卡：是什么 / 干什么 / 为什么 / 替代 / 何时换 | 每格不超过两句话 |
| 33-43 | 录音讲 2 分钟，回听一次 | 不背源码，能自圆其说 |
| 43-50 | 回答“什么时候选 Next” | 至少给 2 个换场条件 |

## 八、收尾自检

- [ ] 能用一句话说清 Lotion 的产品定位
- [ ] 能画出浏览器 → Hono → SQLite 的主链路
- [ ] 能说出 Vite/SPA 的三个收益和两个代价
- [ ] 能说出 Next.js 适合、而本项目不适合的场景
- [ ] 被追问时不会把“Vite 快”当成唯一理由
