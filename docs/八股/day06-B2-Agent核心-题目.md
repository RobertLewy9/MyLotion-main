# Day 6 · B2 轨题纸 —— Agent 词汇与 Tool Calling（面经校准版 · 20 分钟）

> **归属：Day 6 · B2 轨（Agent 八股）**
> 2026-10-23 按 8 场面经校准：携程一面、腾讯云智一面实际问了
> **`skills` 和 `MCP`**、**`tool / skill / subagent / agent` 的区别**、**上下文过长怎么处理**。
> 没有考 ReAct 论文、planner/reflection、停止条件分类，所以这些从今日必做中移除。
> 但 Agent 岗仍要会讲 Tool Calling，因为这是 MyLotion 项目本身的主链路。

## Part 1 · 概念口述

1. `tool`、`skill`、`subagent`、`agent` 分别是什么？四者是什么关系？
2. MCP 是什么？它和 Function Calling 是什么关系？
3. 模型调用工具时，谁负责决定、谁负责真正执行？工具结果怎么回到模型？
4. MyLotion 有 7 个工具，为什么模型不能直接输出一整篇笔记内容来代替工具调用？

## Part 2 · 项目落地（必答）

按「① 我项目里干什么 → ② 完整流程 → ③ 为什么不用 X」讲清 MyLotion 的 Tool Calling：

- 模型决定调用 `searchNotes` / `readNote` / `updateNote` 等工具；
- 工具在服务端执行，并带 `userId` 鉴权；
- 工具执行结果回填给模型；
- 有副作用的操作通过 `onEvent` 上报，前端再刷新或弹确认框。

> 面试官可能会追一句：工具报错时，是把异常直接抛给前端，还是反馈给模型？