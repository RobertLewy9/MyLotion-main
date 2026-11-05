import { describe, expect, it } from "vitest";
import { subarraySum } from "@/src/interview/subarray-sum";

describe("Hot 100 · 和为 K 的子数组（Day 9 · C 轨）", () => {
  it("标准用例：[1,1,1] / 2 → 2", () => {
    expect(subarraySum([1, 1, 1], 2)).toBe(2);
  });

  it("前缀和命中：[1,2,3] / 3 → 2", () => {
    expect(subarraySum([1, 2, 3], 3)).toBe(2);
  });

  it("负数不能忽略：[1,-1,0] / 0 → 3", () => {
    expect(subarraySum([1, -1, 0], 0)).toBe(3);
  });

  it("全零：三个元素的任意子数组都命中", () => {
    expect(subarraySum([0, 0, 0], 0)).toBe(6);
  });

  it("空数组 → 0", () => {
    expect(subarraySum([], 0)).toBe(0);
  });

  it("没有命中 → 0", () => {
    expect(subarraySum([1, 2, 3], 7)).toBe(0);
  });

  it("O(n) 要求：两万个零也必须秒过", () => {
    const nums = new Array<number>(20_000).fill(0);
    const start = Date.now();
    expect(subarraySum(nums, 0)).toBe(200_010_000);
    expect(Date.now() - start).toBeLessThan(200);
  });
});
