import { describe, expect, it } from "vitest";
import { extractMentions, truncateMentionTitle } from "@/src/mention";

describe("extractMentions —— 抠出文本里的文档提及", () => {
  it("空字符串 → 空数组", () => {
    expect(extractMentions("")).toEqual([]);
  });

  it("没有任何提及 → 空数组", () => {
    expect(extractMentions("随便说点什么，没有 at。")).toEqual([]);
  });

  it("抠出单个提及：标题 + id", () => {
    expect(extractMentions("看看 [@季度总结](9f8c1e2a) 这篇")).toEqual([
      { title: "季度总结", id: "9f8c1e2a" },
    ]);
  });

  it("按出现顺序抠出多个提及", () => {
    const text = "[@甲文档](id-aaa) 和 [@乙文档](id-bbb) 对比一下";
    expect(extractMentions(text)).toEqual([
      { title: "甲文档", id: "id-aaa" },
      { title: "乙文档", id: "id-bbb" },
    ]);
  });

  it("标题去掉首尾空白", () => {
    expect(extractMentions("[@  带空格  ](id-aaa)")).toEqual([
      { title: "带空格", id: "id-aaa" },
    ]);
  });

  it("标题为空或只有空白 → 跳过这条", () => {
    expect(extractMentions("[@   ](id-aaa)")).toEqual([]);
  });

  it("同一 id 只保留首次出现", () => {
    const text = "[@旧标题](id-aaa) 中间隔点字 [@新标题](id-aaa)";
    expect(extractMentions(text)).toEqual([{ title: "旧标题", id: "id-aaa" }]);
  });

  it("id 太短（少于 3 个字符）不匹配", () => {
    expect(extractMentions("[@标题](ab)")).toEqual([]);
  });

  it("id 含非法字符不匹配", () => {
    expect(extractMentions("[@标题](id_aaa)")).toEqual([]);
    expect(extractMentions("[@标题](id aaa)")).toEqual([]);
  });

  it("合法与非法混排时，只抠出合法的那些", () => {
    const text = "[@好的](id-good) [@坏的](ab) [@也好](id-ok)";
    expect(extractMentions(text)).toEqual([
      { title: "好的", id: "id-good" },
      { title: "也好", id: "id-ok" },
    ]);
  });

  it("连续调用两次结果必须一致（可重复调用）", () => {
    const text = "[@甲](id-aaa) [@乙](id-bbb)";
    const first = extractMentions(text);
    const second = extractMentions(text);
    expect(second).toEqual(first);
    expect(second).toHaveLength(2);
  });
});

describe("truncateMentionTitle —— 胶囊标题截断", () => {
  it("短标题原样返回", () => {
    expect(truncateMentionTitle("周报")).toBe("周报");
  });

  it("正好等于上限时原样返回", () => {
    expect(truncateMentionTitle("四个字符", 4)).toBe("四个字符");
  });

  it("超长标题截断并加省略号", () => {
    expect(truncateMentionTitle("这是一个很长的标题", 4)).toBe("这是一个…");
  });

  it("默认上限是 4", () => {
    expect(truncateMentionTitle("一二三四五")).toBe("一二三四…");
  });

  it("截断前先去掉首尾空白", () => {
    expect(truncateMentionTitle("  周报  ")).toBe("周报");
  });
});
