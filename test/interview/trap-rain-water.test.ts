import { describe, expect, it } from "vitest";
import { trap } from "@/src/interview/trap-rain-water";

describe("Hot 100 · 接雨水（Day 8 · C 轨）", () => {
  it("标准用例：[0,1,0,2,1,0,1,3,2,1,2,1] → 6", () => {
    expect(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])).toBe(6);
  });

  it("两个柱子围成一格：[4,2,3] → 1", () => {
    expect(trap([4, 2, 3])).toBe(1);
  });

  it("递增高度接不到水：[1,2,3,4] → 0", () => {
    expect(trap([1, 2, 3, 4])).toBe(0);
  });

  it("递减高度接不到水：[4,3,2,1] → 0", () => {
    expect(trap([4, 3, 2, 1])).toBe(0);
  });

  it("空数组 → 0", () => {
    expect(trap([])).toBe(0);
  });

  it("单个柱子 → 0", () => {
    expect(trap([5])).toBe(0);
  });

  it("中间低洼可以累计：[5,0,0,0,5] → 15", () => {
    expect(trap([5, 0, 0, 0, 5])).toBe(15);
  });

  it("O(n) 要求：10 万柱子也必须秒过", () => {
    const height = Array.from({ length: 100_000 }, (_, i) =>
      i % 2 === 0 ? 10_000 : 0,
    );
    const start = Date.now();
    expect(trap(height)).toBeGreaterThan(0);
    expect(Date.now() - start).toBeLessThan(250);
  });
});
