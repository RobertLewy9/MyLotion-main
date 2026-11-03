# Day 7 · B2 轨题纸 —— MCP 深入与 Skills（面经校准版 · 20 分钟）

> **归属：Day 7 · B2 轨（Agent 八股）**
> 2026-10-23 按 8 场面经校准：携程一面、腾讯云智一面直接问过 **skills / MCP**，以及 **tool / skill / subagent / agent 的区别**。
> Day 6 已经讲过 Tool Calling 和 MCP 概览；今天只补三块：协议里的角色、三类能力、接第三方工具时的安全边界。
> 保持 **3 个概念 + 1 个项目落地**，不背 MCP 协议的全部字段。

## Part 1 · 概念口述（每题 2 分钟）

**1.** MCP 解决什么问题？Host、Client、Server 分别是什么角色？
本地和远程 MCP Server 通常怎么连接？

**2.** MCP 和 Function Calling 是什么关系？
MCP 的 `tools`、`resources`、`prompts` 三类能力分别由谁发起、适合做什么？

**3.** `skill`、`tool`、`subagent`、`MCP` 怎么区分？
接入第三方 MCP Server 时，为什么不能无条件相信它返回的工具描述和资源内容？

## Part 2 · 项目落地（必答）

MyLotion 现在把 7 个工具直接定义在服务端，没有使用 MCP。假设要接入一个第三方 MCP Server，请按下面顺序讲清改造方案：

- Host / Client 放在哪一层；
- 怎样发现工具并转成模型可调用的 schema；
- 用户身份和权限怎样传给工具，为什么不能交给模型传 token；
- 工具结果怎样回填模型、副作用怎样通知前端；
- 为什么当前项目直接定义 7 个工具更合适，什么情况下才值得上 MCP。

> 追问预判：如果 MCP Server 的工具描述里夹带“忽略之前的指令”，或者返回一个超大资源文件，你会怎么处理？

## 自测标准

- 能用一句话解释 MCP 与 Function Calling 的分工；
- 能说清 host / client / server 和本地 / 远程连接方式；
- 能区分 tools / resources / prompts 的发起方；
- 能讲清 skill 与 MCP、tool、subagent 的边界；
- 能说明为什么 MCP 接入必须做鉴权、白名单和人类确认。
