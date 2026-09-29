import { describe, expect, it } from "vitest";
import { collectSubtreeIds } from "@/src/subtree";
import type { SidebarDocument } from "@/src/tree";

/** 造数据的小工具：省得每个用例都把字段写全 */
function doc(id: string, parentDocument: string | null = null): SidebarDocument {
  return {
    id,
    title: `标题-${id}`,
    parentDocument,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("collectSubtreeIds —— 一次算出整棵子树", () => {
  it("空数组 → 空结果", () => {
    expect(collectSubtreeIds([], "a")).toEqual([]);
  });

  it("rootId 不在数组里 → 空结果（不抛错）", () => {
    expect(collectSubtreeIds([doc("a"), doc("b", "a")], "不存在")).toEqual([]);
  });

  it("叶子节点没有后代 → 空结果", () => {
    expect(collectSubtreeIds([doc("a"), doc("b", "a")], "b")).toEqual([]);
  });

  it("只有一个直接子节点", () => {
    expect(collectSubtreeIds([doc("a"), doc("b", "a")], "a")).toEqual(["b"]);
  });

  it("多个直接子节点，保持传入顺序", () => {
    const docs = [doc("a"), doc("c", "a"), doc("b", "a")];
    expect(collectSubtreeIds(docs, "a")).toEqual(["c", "b"]);
  });

  it("多层嵌套：子、孙、曾孙都收进来，不含 rootId 自身", () => {
    const docs = [doc("a"), doc("b", "a"), doc("c", "b"), doc("d", "c")];
    expect(collectSubtreeIds(docs, "a")).toEqual(["b", "c", "d"]);
  });

  it("BFS 逐层顺序：先第一层，再第二层", () => {
    //        a
    //      /   \
    //     b     c
    //    /       \
    //   d         e
    const docs = [doc("a"), doc("b", "a"), doc("c", "a"), doc("d", "b"), doc("e", "c")];
    expect(collectSubtreeIds(docs, "a")).toEqual(["b", "c", "d", "e"]);
  });

  it("从中间节点出发：只收它的后代，不含祖先，也不含旁支", () => {
    const docs = [
      doc("a"),
      doc("b", "a"),
      doc("c", "b"),
      doc("x"), // 另一棵独立的树
      doc("y", "x"),
    ];
    expect(collectSubtreeIds(docs, "b")).toEqual(["c"]);
  });

  it("纯函数：不修改传入的数组和对象", () => {
    const docs = [doc("a"), doc("b", "a"), doc("c", "b")];
    const before = JSON.stringify(docs);
    collectSubtreeIds(docs, "a");
    expect(JSON.stringify(docs)).toBe(before);
  });

  it("防环：数据损坏成 a↔b 时不死循环，且不把 root 自己收进来", () => {
    const docs = [doc("a", "b"), doc("b", "a")];
    expect(collectSubtreeIds(docs, "a")).toEqual(["b"]);
  });

  it("防环：自环 a→a 直接返回空", () => {
    expect(collectSubtreeIds([doc("a", "a")], "a")).toEqual([]);
  });
});
