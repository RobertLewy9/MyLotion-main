import { describe, expect, it } from "vitest";
import { lengthOfLongestSubstring } from "@/src/interview/longest-substring";

describe("Hot 100 · 无重复字符的最长子串（Day 8 · C 轨）", () => {
  it("标准用例：abcabcbb → 3", () => {
    expect(lengthOfLongestSubstring("abcabcbb")).toBe(3);
  });

  it("全相同字符：bbbbb → 1", () => {
    expect(lengthOfLongestSubstring("bbbbb")).toBe(1);
  });

  it("全部不同：pwwkew → 3", () => {
    expect(lengthOfLongestSubstring("pwwkew")).toBe(3);
  });

  it("空字符串 → 0", () => {
    expect(lengthOfLongestSubstring("")).toBe(0);
  });

  it("空格也是字符：' ' → 1", () => {
    expect(lengthOfLongestSubstring(" ")).toBe(1);
  });

  it("重复字符出现后，左指针只能向右移动：abba → 2", () => {
    expect(lengthOfLongestSubstring("abba")).toBe(2);
  });

  it("包含数字与符号：dvdf → 3", () => {
    expect(lengthOfLongestSubstring("dvdf")).toBe(3);
  });

  it("O(n) 要求：10 万字符也必须秒过", () => {
    const s = "abcdefghijklmnopqrstuvwxyz".repeat(4_000);
    const start = Date.now();
    expect(lengthOfLongestSubstring(s)).toBe(26);
    expect(Date.now() - start).toBeLessThan(200);
  });
});
