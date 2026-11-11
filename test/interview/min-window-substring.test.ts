import { describe, expect, it } from "vitest";
import { minWindow } from "@/src/interview/min-window-substring";

describe("Hot 100 · 最小覆盖子串（Day 10 · C 轨）", () => {
  it("标准用例：ADOBECODEBANC / ABC → BANC", () => {
    expect(minWindow("ADOBECODEBANC", "ABC")).toBe("BANC");
  });

  it("单字符完全匹配：a / a → a", () => {
    expect(minWindow("a", "a")).toBe("a");
  });

  it("无法覆盖全部字符 → 空字符串", () => {
    expect(minWindow("a", "aa")).toBe("");
  });

  it("重复字符要覆盖次数：aa / aa → aa", () => {
    expect(minWindow("aa", "aa")).toBe("aa");
  });

  it("答案在中间：ab / b → b", () => {
    expect(minWindow("ab", "b")).toBe("b");
  });

  it("t 为空 → 空字符串", () => {
    expect(minWindow("abc", "")).toBe("");
  });

  it("t 比 s 长 → 空字符串", () => {
    expect(minWindow("ab", "abc")).toBe("");
  });
});
