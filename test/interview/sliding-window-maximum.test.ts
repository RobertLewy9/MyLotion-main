import { describe, expect, it } from "vitest";
import { maxSlidingWindow } from "@/src/interview/sliding-window-maximum";

describe("Hot 100 · 滑动窗口最大值（Day 10 · C 轨）", () => {
  it("标准用例：1 3 -1 -3 5 3 6 7 / k=3", () => {
    expect(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([3, 3, 5, 5, 6, 7]);
  });

  it("k=1 时每个元素都是窗口最大值", () => {
    expect(maxSlidingWindow([1, -1], 1)).toEqual([1, -1]);
  });

  it("k 等于数组长度时只有一个结果", () => {
    expect(maxSlidingWindow([4, 2, 9, 1], 4)).toEqual([9]);
  });

  it("单调递减数组：窗口最大值始终在最左端", () => {
    expect(maxSlidingWindow([7, 5, 3, 1], 2)).toEqual([7, 5, 3]);
  });

  it("重复元素不能误删等值候选", () => {
    expect(maxSlidingWindow([1, 1, 1, 1], 2)).toEqual([1, 1, 1]);
  });

  it("空数组返回空结果", () => {
    expect(maxSlidingWindow([], 3)).toEqual([]);
  });

  it("O(n) 要求：10 万规模不能退化成 O(nk)", () => {
    const nums = Array.from({ length: 100_000 }, (_, i) => i % 997);
    const start = Date.now();
    const result = maxSlidingWindow(nums, 1_000);
    expect(result).toHaveLength(99_001);
    expect(Date.now() - start).toBeLessThan(300);
  });
});
