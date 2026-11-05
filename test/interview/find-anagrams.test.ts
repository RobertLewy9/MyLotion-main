import { describe, expect, it } from "vitest";
import { findAnagrams } from "@/src/interview/find-anagrams";

describe("Hot 100 · 找到字符串中所有字母异位词（Day 9 · C 轨）", () => {
  it("标准用例：cbaebabacd / abc → [0, 6]", () => {
    expect(findAnagrams("cbaebabacd", "abc")).toEqual([0, 6]);
  });

  it("连续命中：abab / ab → [0, 1, 2]", () => {
    expect(findAnagrams("abab", "ab")).toEqual([0, 1, 2]);
  });

  it("模式比原串长 → []", () => {
    expect(findAnagrams("a", "ab")).toEqual([]);
  });

  it("空字符串 → []", () => {
    expect(findAnagrams("", "a")).toEqual([]);
  });

  it("完全匹配：abc / abc → [0]", () => {
    expect(findAnagrams("abc", "abc")).toEqual([0]);
  });

  it("重复字符：aa / aa → [0]", () => {
    expect(findAnagrams("aa", "aa")).toEqual([0]);
  });

  it("O(n) 要求：长串也必须秒过", () => {
    const s = "abc".repeat(20_000);
    const start = Date.now();
    expect(findAnagrams(s, "abc")).toHaveLength(20_000);
    expect(Date.now() - start).toBeLessThan(200);
  });
});
