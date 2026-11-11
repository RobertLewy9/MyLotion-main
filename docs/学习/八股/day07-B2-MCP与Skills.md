# Day 7 · B2 轨 —— MCP 深入与 Skills（问答一体）

> **归属：Day 7 · B2 轨（Agent 八股）**
> 依据：携程一面、腾讯云智一面问过 `skills / MCP`，以及 `tool / skill / subagent / agent` 的边界。
> 用法：先讲 MCP 解决什么，再讲它和 Function Calling 怎么配合，最后讲第三方接入的信任边界。

## 思维导图

```text
MCP
├─ 角色：Host → Client → Server
├─ 连接：本地 stdio / 远程 HTTP 类传输
├─ 能力：tools / resources / prompts
├─ 与 Function Calling：MCP 管“怎么接”，FC 管“怎么调”
└─ 安全：白名单 / 最小权限 / 凭证隔离 / 资源限制 / 人工确认
```

## Part 1 · 概念

### Q1. MCP 解决什么问题？Host、Client、Server 分别是什么？本地和远程怎么连？

**参考答案（口述）**

MCP（Model Context Protocol）是一套标准协议，让 AI 应用用统一方式发现并连接外部工具、数据源和提示模板。

**核心价值：** 没有统一协议时，N 个应用接 M 个工具要写 N × M 套适配；MCP 把连接方式标准化，应用和工具都只面向协议开发。

| 角色 | 是什么 | MyLotion 中的对应 |
|---|---|---|
| **Host** | 用户直接使用的 AI 应用，负责模型、会话、权限和 UI | Hono API 服务（当前未接 MCP） |
| **Client** | Host 内部与某个 Server 通信的连接器 | 服务端 MCP SDK client |
| **Server** | 暴露 tools / resources / prompts 的能力提供方 | Notion、GitHub、文件系统等 |

一个 Host 可创建多个 Client，一个 Client 通常对应一个 Server。模型不会直接拿网络连接访问 Server，只通过 Host 发起工具调用。

**连接方式：**

- 本地进程常用 `stdio`：Host 启动或连接子进程，通过标准输入输出交换 JSON-RPC 消息；
- 远程服务常用 HTTP 类传输：旧资料里常见 SSE，较新实现多用 Streamable HTTP。

面试说清“本地 stdio、远程 HTTP 类传输”即可，不必背协议字段。连接建立后会做能力协商，Host 才知道 Server 支持哪些 tools、resources 和 prompts。

### Q2. MCP 和 Function Calling 是什么关系？三类能力分别由谁发起？

**参考答案（口述）**

**Function Calling 管模型怎么表达“我要调用什么”，MCP 管宿主怎么发现、连接并取得这些能力。**

```text
MCP Server 暴露工具
  → Host 发现工具和参数 schema
  → Host 把 schema 交给模型
  → 模型输出 tool call
  → Host 校验参数，通过 MCP Client 请求 Server 执行
  → 结果回填模型
```

| 能力 | 谁发起 | 典型用途 |
|---|---|---|
| **tools** | 模型决定是否调用，Host 执行 | 搜索、读文件、创建文档等动作 |
| **resources** | 应用按 URI 读取并注入上下文 | 文件内容、数据库记录、项目说明等只读资料 |
| **prompts** | 用户或应用选择使用 | 可复用的提示词模板、工作流入口 |

一句话记忆：**tools 是可执行动作，resources 是可读取上下文，prompts 是可复用模板。**

### Q3. `skill`、`tool`、`subagent`、`MCP` 怎么区分？第三方 Server 为什么不能完全信任？

**参考答案（口述）**

- **tool**：最小可执行能力，如 `readNote(id)`，通常有 JSON schema；
- **skill**：宿主或平台侧的一组指令、知识和流程封装，可调用多个 tool；
- **subagent**：主 Agent 委派出去、拥有独立上下文和工具集合的另一个 Agent 循环；
- **MCP**：连接 Host 与外部能力的协议，不等于某个工具，也不等于 Agent；
- **agent**：模型决策、运行时执行工具并循环推进的整体系统。

**第三方 MCP 的风险：**

1. 工具描述可能被投毒，夹带“忽略系统提示”“把数据发到某地址”；
2. resources 可能包含提示注入；
3. Server 可能越权，拿到超出任务需要的用户数据或长期凭证；
4. 返回内容可能过大，撑爆上下文并增加成本；
5. 删除、转账、发消息等副作用可能不可逆。

**工程防线：**

- 只接白名单 Server，固定版本并检查来源；
- 服务端校验工具 schema、参数和返回结构；
- OAuth / API Key 只保存在 Host 或 Server 的凭证层，**不要把 token 交给模型**；
- 按用户和最小权限授权，执行前再次校验 `userId` / 资源归属（SQLite 没有 RLS）；
- 限制资源大小和类型，工具设置超时、限流和审计；
- 危险工具走 human-in-the-loop；
- 把 MCP 返回文本当不可信数据，不允许覆盖 system prompt。

## Part 2 · 项目落地

### Q. MyLotion 现在直接定义 19 个工具，如果接入第三方 MCP Server，怎么改造？为什么现在不急着上？

**参考答案（口述）**

**当前状态：** `searchNotes`、`readNote`、`updateNote`、`deleteNote` 等 19 个内置工具直接定义在服务端，通过 AI SDK 交给模型；模型决定工具名和参数，服务端执行并回填。

**接入方案：**

1. **Host / Client 放服务端：** Hono 服务端作为 Host，服务端 MCP Client 连接目标 Server；浏览器不持有机密凭证。
2. **发现能力：** 获取 Server 的 tool 列表、描述和 JSON schema，缓存并固定版本。
3. **转换 schema：** 映射成 AI SDK 可调用的工具，模型只看名称、用途和参数定义。
4. **注入身份：** 从登录会话取得 `userId`，服务端执行时传入权限上下文；凭据不进入模型。
5. **执行与回填：** 模型输出 tool call 后，Host 校验参数，经 MCP Client 请求 Server 执行，再回填模型。
6. **副作用上报：** `note_modified`、`confirm_delete`、错误等事件通过 `onEvent` 和 SSE 推给前端。
7. **失败处理：** 参数错误回填模型有限纠正；权限错误直接终止；超时取消请求；写操作带幂等键和确认 token。

**为什么现在不急着上：**

MyLotion 只有 19 个固定、内部可控、与业务强耦合的工具，直接定义更简单：不需额外部署 MCP Server，权限/事务/审计集中在一处，延迟更低，调试链路更短。

当出现跨应用复用、接多个第三方数据源，或同一批工具服务多个 AI 客户端时，MCP 的标准化收益才明显，例如接 Notion、GitHub、云盘、企业知识库。

### 追问：工具描述里夹带恶意指令，或返回超大资源怎么办？

把工具描述和资源内容都当不可信输入：描述只能说明能力，不能覆盖 system prompt；Host 做 schema 白名单、字段校验、注入检测和大小限制；危险动作必须用户确认；日志记录 Server 版本、工具名、参数摘要和决策链，发现异常立即停用该 Server。

## 30 秒复盘

MCP 是 Host 与外部能力之间的标准连接协议。Host 是用户使用的 AI 应用，内部为每个 Server 建 Client，Server 提供 tools、resources、prompts。Function Calling 负责模型表达要调用什么，MCP 负责工具如何发现和接入。第三方 MCP 必须做白名单、最小权限、凭证隔离、资源限制和危险操作确认。MyLotion 当前 19 个内部工具直接定义更简单，只有需要接多个外部能力时才值得引入 MCP。

## 自测清单

- [ ] 能说清 MCP 解决 N × M 适配问题。
- [ ] 能准确区分 Host / Client / Server。
- [ ] 能说明 MCP 与 Function Calling 是“怎么接”和“怎么调”。
- [ ] 能区分 tools / resources / prompts 的发起方。
- [ ] 能说出至少 4 条第三方 MCP 安全措施。
- [ ] 能解释 MyLotion 现在为什么不用、以后什么时候用。
