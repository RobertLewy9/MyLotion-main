import { describe, expect, it } from "vitest";
import { longestConsecutive } from "@/src/interview/longest-consecutive";

describe("Hot 100 · 最长连续序列（Day 6 · C 轨）", () => {
  it("标准用例：[100,4,200,1,3,2] → 4", () => {
    expect(longestConsecutive([100, 4, 200, 1, 3, 2])).toBe(4);
  });

  it("需要去重：[0,3,7,2,5,8,4,6,0,1] → 9", () => {
    expect(longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])).toBe(9);
  });

  it("空数组 → 0", () => {
    expect(longestConsecutive([])).toBe(0);
  });

  it("单个元素 → 1", () => {
    expect(longestConsecutive([7])).toBe(1);
  });

  it("重复元素都要去掉：[1,2,0,1] → 3", () => {
    expect(longestConsecutive([1, 2, 0, 1])).toBe(3);
  });

  it("全重复：[5,5,5] → 1", () => {
    expect(longestConsecutive([5, 5, 5])).toBe(1);
  });

  it("负数：[-1,0,1,2,-5] → 4", () => {
    expect(longestConsecutive([-1, 0, 1, 2, -5])).toBe(4);
  });

  it("O(n) 要求：10 万元素也必须秒过（排序解会慢一个量级）", () => {
    const nums = Array.from({ length: 100_000 }, (_, i) => i * 2);
    const start = Date.now();
    expect(longestConsecutive(nums)).toBe(1);
    expect(Date.now() - start).toBeLessThan(200);
  });
});