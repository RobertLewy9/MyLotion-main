# Day 9 · 2026-11-05 · 全轨准备记录

> **归属：Day 9 · 全轨（材料准备 + 待学习打卡）**
> 依据：学习计划 Day 9 —— 缓存失效 / `fresh` / `prefetch`；Map / WeakMap / 内存泄漏；两道 Hot 100。
> 状态说明：**今天先把学习材料和本地练习靶子准备好，不等于已经学会。** 下面的口述、力扣打卡和错题复盘仍保留未完成。

## 今日任务

| 轨 | 内容 | 状态 |
|----|------|------|
| A · MyLotion | 读 `src/data/document-cache.ts` + `docs/讲稿/day09-A-缓存失效与预取.md`，讲清 `invalidate` / `fresh` / `prefetch` | 🟡 代码、用例、讲稿就绪，待口述 |
| B1 · 前端八股 | `docs/八股/day09-B1-Map-WeakMap与内存泄漏.md`（题目 + 答案同页，3 题 + 项目落地） | 🟡 题纸就绪，待 20 分钟闭卷 |
| B2 · Agent 八股 | `docs/八股/day09-B2-记忆与RAG基础.md`（短期 / 长期记忆 + RAG + chunk / rerank） | 🟡 题纸就绪，待 20 分钟闭卷 |
| C · 力扣 | 找到字符串中所有字母异位词 + 和为 K 的子数组，每题限时 20 分钟 | ⬜ 待力扣首刷 |
| C · 题解 | `docs/讲稿/day09-C-找到字符串中所有字母异位词.md` / `day09-C-和为K的子数组.md` | 🟡 题解就绪，先手写后看 |
| ✱ 简历对齐 | 用“① 干什么 → ② 完整流程 → ③ 为什么”讲缓存失效 2 分钟 | ⬜ |

## A 轨增量

- `DocumentCache` 新增 `get(id, fetcher, { fresh })`：绕过已完成缓存，但同 id 在途请求仍合并。
- 新增 `prefetch(id, fetcher)`：后台预热，失败静默且不缓存。
- 修复 pending 清理时序：回填、`finally` 清理和调用方 resolve 串在同一条 promise 上。
- `test/data/document-cache.test.ts` 增加到 18 个用例，覆盖 `fresh`、并发 `fresh`、`prefetch` 成功 / 失败 / 已缓存。
- 验证命令：`node node_modules/vitest/vitest.mjs run test/data/document-cache.test.ts`，结果 **18/18 通过**。

## C 轨靶子

- `src/interview/find-anagrams.ts` + 7 个用例：定长滑动窗口 + 字符频次。
- `src/interview/subarray-sum.ts` + 7 个用例：前缀和 + 哈希表。
- **本地源码刻意保留 `TODO`，当前红测用于闭卷练习；不要把红测误判为材料缺失。**

## 待口述

- [ ] `invalidate` 为什么同时清 `values` 和 `pending`？
- [ ] `fresh` 和 `invalidate` 的区别是什么？刷新失败时旧缓存怎么处理？
- [ ] `prefetch` 为什么吞错？预取过多会有什么反作用？
- [ ] 普通对象、`Map`、`WeakMap` 在键类型、迭代、`size`、GC 上有什么区别？
- [ ] 前端内存泄漏的常见来源和 DevTools 定位流程是什么？
- [ ] 用 2 分钟讲清 MyLotion 的缓存失效方案。

## 错题本

| 轨 | 题目 | 错在哪 | 下次怎么改 |
|----|------|--------|-----------|
| A | 缓存失效时序 | | |
| B1 | Map / WeakMap 取舍 | | |
| B1 | 内存泄漏定位 | | |
| B2 | 短期 / 长期记忆 | | |
| B2 | RAG 链路与 rerank | | |
| C | 找到字符串中所有字母异位词 | | |
| C | 和为 K 的子数组 | | |

## 收尾

- [ ] 合上讲稿，用 2 分钟讲完 A 轨缓存失效与预取
- [ ] 合上答案，用 2 分钟讲完 B1 Map / WeakMap 与内存泄漏
- [ ] 合上答案，用 2 分钟讲完 B2 记忆与 RAG 基础
- [ ] 两道 C 题完成力扣打卡，并记录用时与错因
- [ ] 把卡壳点补进本页，不把“看过”当成“会了”
