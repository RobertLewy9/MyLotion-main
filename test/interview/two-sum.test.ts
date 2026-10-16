import { describe, expect, it } from "vitest";
import { twoSum } from "@/src/interview/two-sum";

/** 两数之和允许返回任意一组合法下标，统一排序后再比对 */
const sorted = (r: number[]) => [...r].sort((a, b) => a - b);

describe("Hot 100 · 两数之和（Day 5 · C 轨）", () => {
  it("基础用例：[2,7,11,15] target=9", () => {
    expect(sorted(twoSum([2, 7, 11, 15], 9))).toEqual([0, 1]);
  });

  it("答案在后半段：[3,2,4] target=6", () => {
    expect(sorted(twoSum([3, 2, 4], 6))).toEqual([1, 2]);
  });

  it("有负数：[-3,4,3,90] target=0", () => {
    expect(sorted(twoSum([-3, 4, 3, 90], 0))).toEqual([0, 2]);
  });

  it("两个相同元素：[-1,-1] target=-2", () => {
    expect(sorted(twoSum([-1, -1], -2))).toEqual([0, 1]);
  });

  it("同一个元素不能用两次：[3,3] target=6 必须是 [0,1]，不能是 [0,0]", () => {
    expect(sorted(twoSum([3, 3], 6))).toEqual([0, 1]);
  });

  it("不能反着返回：[2,1] target=3", () => {
    expect(sorted(twoSum([2, 1], 3))).toEqual([0, 1]);
  });

  it("O(n) 要求：10 万元素也必须秒过（暴力 O(n²) 会超时）", () => {
    const nums = Array.from({ length: 100_000 }, (_, i) => i);
    const start = Date.now();
    const r = twoSum(nums, 99_998 + 99_999);
    expect(sorted(r)).toEqual([99_998, 99_999]);
    expect(Date.now() - start).toBeLessThan(200);
  });
});