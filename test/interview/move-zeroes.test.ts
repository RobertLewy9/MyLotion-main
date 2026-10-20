import { describe, expect, it } from "vitest";
import { moveZeroes } from "@/src/interview/move-zeroes";

describe("Hot 100 · 移动零（Day 6 · C 轨）", () => {
  it("标准用例：[0,1,0,3,12] → [1,3,12,0,0]", () => {
    const nums = [0, 1, 0, 3, 12];
    moveZeroes(nums);
    expect(nums).toEqual([1, 3, 12, 0, 0]);
  });

  it("只有一个 0：[0] → [0]", () => {
    const nums = [0];
    moveZeroes(nums);
    expect(nums).toEqual([0]);
  });

  it("没有 0：[1,2,3] 保持不变", () => {
    const nums = [1, 2, 3];
    moveZeroes(nums);
    expect(nums).toEqual([1, 2, 3]);
  });

  it("全是 0：[0,0,0] 保持不变", () => {
    const nums = [0, 0, 0];
    moveZeroes(nums);
    expect(nums).toEqual([0, 0, 0]);
  });

  it("保持非零元素的相对顺序：[0,2,0,1] → [2,1,0,0]", () => {
    const nums = [0, 2, 0, 1];
    moveZeroes(nums);
    expect(nums).toEqual([2, 1, 0, 0]);
  });

  it("必须是原地修改：传入的数组对象本身就是结果", () => {
    const nums = [0, 1];
    const sameRef = nums;
    moveZeroes(nums);
    expect(nums).toBe(sameRef);
  });

  it("O(n) 要求：10 万元素也必须秒过", () => {
    const nums = Array.from({ length: 100_000 }, (_, i) => (i % 2 === 0 ? 0 : i));
    const start = Date.now();
    moveZeroes(nums);
    expect(Date.now() - start).toBeLessThan(200);
    expect(nums[0]).toBe(1);
    expect(nums.at(-1)).toBe(0);
  });
});