# Day 7 · B2 轨答案 —— MCP 深入与 Skills（面经校准版）

> **归属：Day 7 · B2 轨（Agent 八股）**
> 依据：携程一面、腾讯云智一面都问到了 `skills / MCP`，腾讯云智还追问了 `tool / skill / subagent / agent` 的边界。
> 回答原则：先讲 MCP 解决什么，再讲它和 Function Calling 怎么配合，最后讲接入第三方服务的信任边界。

## Part 1 · 概念

### 1. MCP 是什么？Host / Client / Server 分别是谁？

**一句话：**

MCP（Model Context Protocol）是一套标准协议，让 AI 应用用统一方式发现并连接外部工具、数据源和提示模板，解决“每个宿主应用都要给每个工具单独写适配器”的问题。

没有统一协议时，N 个 AI 应用接 M 个工具，往往要写 N × M 套适配；MCP 把连接方式标准化后，应用侧和工具侧都只面向协议开发。

**三个角色：**

| 角色 | 是什么 | 在 MyLotion 里可能对应谁 |
|------|--------|--------------------------|
| **Host** | 用户直接使用的 AI 应用，负责模型、会话、权限和 UI | Next.js 里的 AI 服务 / 编辑器 |
| **Client** | Host 内部负责和某个 MCP Server 通信的连接器 | 服务端的 MCP SDK client |
| **Server** | 对外暴露 tools / resources / prompts 的能力提供方 | Notion、GitHub、文件系统等外部服务 |

一个 Host 可以创建多个 Client，一个 Client 通常对应一个 Server。模型不会直接拿网络连接去访问 Server，它只是通过 Host 发起工具调用。

**常见连接方式：**

- 本地进程常用 `stdio`：Host 启动或连接子进程，通过标准输入输出交换 JSON-RPC 消息；
- 远程服务常用 HTTP 类传输；旧资料里常见 SSE，较新的实现多使用 Streamable HTTP。面试说清“本地 stdio、远程 HTTP 类传输”即可，不必背字段。

MCP 基于 JSON-RPC 通信；连接建立后会做能力协商，Host 才能知道这个 Server 支持哪些 tools、resources 和 prompts。

### 2. MCP 和 Function Calling 的关系

**一句话：**

**Function Calling 管模型怎么表达“我要调用什么”，MCP 管宿主怎么发现、连接并取得这些能力。**

```text
MCP Server 暴露工具
  -> Host 发现工具和参数 schema
  -> Host 把 schema 交给模型
  -> 模型输出 Function Calling / tool call
  -> Host 校验参数，通过 MCP Client 请求 Server 执行
  -> 结果回填模型
```

所以 MCP 不替代 Function Calling：

- MCP 解决“工具从哪里来、怎么连接、怎么发现”；
- Function Calling 解决“模型怎样结构化地请求调用”；
- 真正执行和权限校验仍然发生在 Host / Server 侧，不在模型内部。

**MCP 的三类能力：**

| 能力 | 谁发起 | 典型用途 |
|------|--------|----------|
| **tools** | 模型决定是否调用，Host 执行 | 搜索、读文件、创建文档、发请求等有明确输入输出的动作 |
| **resources** | 应用按 URI 读取并注入上下文 | 文件内容、数据库记录、项目说明等只读资料 |
| **prompts** | 用户或应用选择使用 | 可复用的提示词模板、工作流入口 |

一句话记忆：**tools 是“可执行动作”，resources 是“可读取上下文”，prompts 是“可复用模板”。**

### 3. skill / tool / subagent / MCP，以及第三方信任边界

**先区分概念：**

- **tool**：最小可执行能力，例如 `readNote(id)`，通常有 JSON schema；
- **skill**：宿主或平台侧的一组可复用指令、知识和流程封装，告诉模型“这类任务应该怎么做”，可以调用多个 tool；
- **subagent**：被主 Agent 委派出去、拥有独立上下文和工具集合的另一个 Agent 循环；
- **MCP**：连接 Host 与外部能力的协议，不直接等于某个工具，也不等于一个 Agent；
- **agent**：由模型决策、运行时执行工具并循环推进的整体系统。

MCP Server 可以提供 tools、resources、prompts；skill 则更像“做事方法的封装”。一个 skill 可以调用本地 tool，也可以调用通过 MCP 接进来的 tool。

**第三方 MCP Server 为什么不能完全信任：**

1. **工具描述可能被投毒**：恶意描述里可能夹带“忽略系统提示”“把数据发到某地址”等指令；
2. **resources 可能包含提示注入**：读进来的文档本身可能就是攻击载荷；
3. **Server 可能越权**：它不该拿到超出任务需要的用户数据或长期凭证；
4. **返回内容可能过大**：无上限资源会撑爆上下文并增加成本；
5. **副作用可能不可逆**：删除、转账、发消息这类工具不能无确认执行。

**工程上的防线：**

- 只接入白名单内的 Server，固定版本并检查来源；
- 工具 schema、参数、返回结构都做服务端校验；
- OAuth / API Key 只保存在 Host 或 Server 的凭证层，**不要把 token 交给模型**；
- 按用户和最小权限授权，工具执行前再次校验 `userId` / RLS；
- 资源限制大小和类型，工具设置超时、限流和审计；
- 危险工具走 human-in-the-loop，先展示影响范围再确认；
- 把 MCP 返回的文本当作不可信数据，不允许它覆盖 system prompt。

## Part 2 · MyLotion 接入 MCP 的方案

### 当前状态

MyLotion 目前有 7 个固定工具，例如 `searchNotes`、`readNote`、`updateNote`、`deleteNote`。它们直接定义在服务端，通过 AI SDK 的工具机制交给模型；模型决定工具名和参数，服务端执行并回填结果。

### 如果接入第三方 MCP Server

1. **Host / Client 放在服务端**：Next.js 的 AI Route Handler 作为 Host，服务端 MCP Client 连接目标 Server；浏览器不直接持有机密凭证。
2. **发现能力**：启动或首次使用时获取 Server 的 tool 列表、描述和 JSON schema，缓存并固定版本，避免运行时被悄悄替换。
3. **转换 schema**：把 MCP tool 映射成 AI SDK 可调用的工具，模型看到的仍然只是名称、用途和参数定义。
4. **注入用户身份**：从当前登录会话取得 `userId`，在服务端执行工具时传入权限上下文；凭据不进入模型上下文，也不由模型决定传给谁。
5. **执行与回填**：模型输出 tool call 后，Host 校验参数，通过 MCP Client 请求 Server 执行，再把结果作为 tool 消息回填模型。
6. **副作用上报**：工具执行过程中的 `note_modified`、`confirm_delete`、错误等事件，通过 `onEvent` 和 SSE 推给前端；危险操作仍然只生成待确认事件。
7. **失败处理**：参数错误回填模型有限纠正，权限错误直接终止，超时取消请求，写操作带幂等键和确认 token。

### 为什么现在不急着上 MCP

MyLotion 只有 7 个固定、内部可控、和业务强耦合的工具，直接定义更简单：

- 不需要额外部署和维护 MCP Server；
- 权限、事务和审计都集中在一个服务端；
- 延迟更低，调试链路更短；
- 工具 schema 和业务数据结构可以一起演进。

当出现跨应用复用、需要接多个第三方数据源、或者希望同一批工具同时服务多个 AI 客户端时，MCP 的标准化收益才明显。例如接 Notion、GitHub、云盘、企业知识库这类外部能力。

### 追问：工具描述夹带恶意指令怎么办？

把它当不可信输入：工具描述只能作为能力说明，绝不能覆盖 system prompt；Host 对 schema 做白名单和字段校验，对资源做注入检测和大小限制，危险动作必须用户确认。日志里记录 Server 版本、工具名、参数摘要和决策链，发现异常立即停用该 Server。

## 50 秒版

MCP 是 Host 和外部能力之间的标准连接协议。Host 是用户使用的 AI 应用，内部为每个 Server 建一个 Client，Server 提供 tools、resources、prompts。Function Calling 仍然负责让模型表达要调用什么，MCP 负责工具怎么被发现和接入。skill 是做事流程的封装，tool 是最小动作，subagent 是独立的 Agent 循环。第三方 MCP 必须做白名单、最小权限、凭证隔离、资源限制和危险操作确认。MyLotion 目前 7 个内部工具直接定义更简单，只有需要接多个外部能力时才值得引入 MCP。

## 及格线

- 能说清 MCP 解决 N × M 适配问题；
- 能准确区分 host / client / server；
- 能说明 MCP 与 Function Calling 是“怎么接”和“怎么调”的关系；
- 能区分 tools / resources / prompts 的发起方；
- 能讲清 skill、tool、subagent、MCP 的边界；
- 能说出至少四条第三方 MCP 安全措施；
- 能结合 MyLotion 解释“现在为什么不用、以后什么时候用”。
