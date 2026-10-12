/**
 * Day 3 —— 文档提及（@mention）解析
 *
 * 背景（对应 Lotion 的真实代码 lib/mention.ts）：
 *   AI 面板的胶囊输入框选中某个文档后，会序列化成这样的文本发给服务端/Agent：
 *
 *       [@季度总结](9f8c1e2a)
 *
 *   服务端得先把用户这段话里所有提及「抠」出来，才知道用户 @ 了哪些文档，
 *   再据此去读文档内容、拼进模型上下文。
 *
 * 题目：实现下面两个纯函数。
 *
 * 一、extractMentions(text) —— 抠出全部提及
 *  1. 匹配形如 [@标题](id) 的片段：标题允许任意字符（但不含 ]），
 *     id 只允许字母、数字、连字符，长度 3~64
 *  2. 按出现先后顺序返回
 *  3. 标题去掉首尾空白；去空白后为空 → 跳过这条
 *  4. 同一个 id 只保留「首次」出现的那条（去重）
 *  5. 纯函数，不修改任何外部状态
 *
 * 二、truncateMentionTitle(title, maxChars = 4) —— 胶囊标题截断
 *  1. 先去掉首尾空白
 *  2. 长度 ≤ maxChars → 原样返回
 *  3. 超长 → 截到 maxChars 个字符，末尾补一个省略号 "…"
 *
 * 提示：
 *  - 正则可以从 /\[@([^\]]+)\]\(([a-zA-Z0-9-]{3,64})\)/g 起步。
 *  - 带 g 的正则是有状态的（lastIndex）：用 exec 循环能跑通，但别把它当纯函数依赖；
 *    每次调用 new 一个新实例（或改用 matchAll）更稳妥。
 *  - 顺带一个 JS 老坑：String.prototype.match 带 g 标志时只返回「整段匹配字符串」，
 *    拿不到捕获组，别用错。
 *  - 字符串长度按 UTF-16 计算（中文按 1 个、emoji 按 2 个），与 Lotion 原实现一致。
 *
 * TODO: 你来实现（把下面两个函数体替换掉）
 */
export interface Mention {
  title: string;
  id: string;
}

/** 抠出文本里所有文档提及，按出现顺序、按 id 去重 */
export function extractMentions(text: string): Mention[] {
  throw new Error("extractMentions 还没实现");
}

/** 胶囊标题截断：超过 maxChars 个字时截断并加省略号 */
export function truncateMentionTitle(title: string, maxChars = 4): string {
  throw new Error("truncateMentionTitle 还没实现");
}
