/**
 * Day 3 —— 文档提及（@mention）解析
 *
 * 背景（对应 Lotion 的真实代码 lib/mention.ts）：
 *   AI 面板的胶囊输入框选中某个文档后，会序列化成这样的文本发给服务端/Agent：
 *
 *       [@季度总结](9f8c1e2a)
 *
 *   标记文本随 prompt 一起交给模型，**服务端主链路并不解析它** —— 而是靠系统提示词
 *   约定「看到 [@标题](id) 就直接用其中的 id 调 readNote」，由模型自己识别。
 *   本模块是把这套协议收敛成可复用的纯函数：truncateMentionTitle 前端渲染胶囊在用，
 *   extractMentions 目前主链路未接（只有单测），是留给服务端做统计/校验的能力沉淀。
 *
 * 面试怎么讲（1 分钟版）：
 *   "用户 @ 文档后前端把它序列化成 [@标题](id) 的标记文本，随 prompt 一起发给服务端；
 *    服务端不解析，而是靠提示词约定让模型自己识别标记、按 id 调 readNote 去读文档。
 *    这里有两个容易踩的坑：一是带 g 的正则对象 lastIndex 是有状态的，跨调用复用会串味，
 *    所以每次 new 一个新实例；二是 String.match 带 g 时只返回整段匹配、拿不到捕获组，
 *    必须用 exec 循环或 matchAll。"
 *
 * 实现要点：
 *  1. 匹配 [@标题](id)：标题任意字符（不含 ]），id 为字母/数字/连字符，长度 3~64
 *  2. 按出现顺序返回；标题 trim 后为空 → 跳过；同一 id 只保留首次出现
 *  3. 正则每次调用新建实例，避免 lastIndex 状态泄漏
 */
export interface Mention {
  title: string;
  id: string;
}

/** 匹配 [@标题](id)：标题任意字符（不含 ]），id 为字母/数字/连字符，长度 3~64 */
const MENTION_SOURCE = /\[@([^\]]+)\]\(([a-zA-Z0-9-]{3,64})\)/g;

/** 抠出文本里所有文档提及，按出现顺序、按 id 去重 */
export function extractMentions(text: string): Mention[] {
  const mentions: Mention[] = [];
  const seen = new Set<string>();
  // 每次调用新建正则实例：模块级带 g 的正则有 lastIndex 状态，复用会出问题
  const regex = new RegExp(MENTION_SOURCE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const title = m[1].trim();
    const id = m[2];
    if (!title || !id) continue;
    if (seen.has(id)) continue; // 同一文档只保留首次提及
    seen.add(id);
    mentions.push({ title, id });
  }
  return mentions;
}

/** 胶囊标题截断：超过 maxChars 个字时截断并加省略号（完整标题保留在悬停提示/序列化中） */
export function truncateMentionTitle(title: string, maxChars = 4): string {
  const t = title.trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + "…";
}
