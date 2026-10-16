import { describe, expect, it } from "vitest";
import { groupAnagrams } from "@/src/interview/group-anagrams";

/** 分组结果与顺序无关，统一规范化后再比对 */
const norm = (groups: string[][]) =>
  groups
    .map((g) => [...g].sort())
    .sort((a, b) => a.join(",").localeCompare(b.join(",")));

describe("Hot 100 · 字母异位词分组（Day 5 · C 轨）", () => {
  it("基础用例", () => {
    expect(norm(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))).toEqual(
      norm([["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]),
    );
  });

  it("空字符串自成一组", () => {
    expect(norm(groupAnagrams([""]))).toEqual(norm([[""]]));
  });

  it("单个字符", () => {
    expect(norm(groupAnagrams(["a"]))).toEqual(norm([["a"]]));
  });

  it("字符相同但数量不同，不能分到一起", () => {
    expect(norm(groupAnagrams(["aab", "abb"]))).toEqual(norm([["aab"], ["abb"]]));
  });

  it("长度不同一定不是异位词", () => {
    expect(norm(groupAnagrams(["ab", "abc"]))).toEqual(norm([["ab"], ["abc"]]));
  });

  it("性能：1 万个串也要秒过", () => {
    const strs = Array.from({ length: 10_000 }, (_, i) => "abcdefghij" + (i % 100));
    const start = Date.now();
    groupAnagrams(strs);
    expect(Date.now() - start).toBeLessThan(500);
  });
});