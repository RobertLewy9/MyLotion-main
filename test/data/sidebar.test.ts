import { describe, expect, it } from "vitest";
import {
  createSidebarIndex,
  getChildren,
  getSidebarTree,
} from "@/src/data/sidebar";
import type { DocumentRow } from "@/src/data/documents";

function row(id: string, overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id,
    title: `标题-${id}`,
    parentDocument: null,
    userId: "u1",
    isPublished: true,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getSidebarTree —— 全量模式", () => {
  it("过滤他人 / 归档后建树", () => {
    const rows = [
      row("root"),
      row("child", { parentDocument: "root" }),
      row("archived", { isArchived: true }),
      row("other", { userId: "u2" }),
    ];
    const tree = getSidebarTree(rows, { userId: "u1" });
    expect(tree.map((n) => n.id)).toEqual(["root"]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["child"]);
  });

  it("子节点按 updatedAt 降序", () => {
    const rows = [
      row("root"),
      row("old", { parentDocument: "root", updatedAt: "2026-01-01T00:00:00.000Z" }),
      row("new", { parentDocument: "root", updatedAt: "2026-03-01T00:00:00.000Z" }),
    ];
    const tree = getSidebarTree(rows, { userId: "u1" });
    expect(tree[0].children.map((n) => n.id)).toEqual(["new", "old"]);
  });

  it("空数组 → 空树", () => {
    expect(getSidebarTree([], { userId: "u1" })).toEqual([]);
  });
});

describe("getChildren —— 懒加载模式（只取直接子节点）", () => {
  it("parentId = null 取根节点", () => {
    const rows = [row("a"), row("b"), row("c", { parentDocument: "a" })];
    expect(getChildren(rows, null, { userId: "u1" }).map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("只返回直接子节点，不包含孙节点", () => {
    const rows = [
      row("a"),
      row("b", { parentDocument: "a" }),
      row("c", { parentDocument: "b" }),
    ];
    expect(getChildren(rows, "a", { userId: "u1" }).map((r) => r.id)).toEqual([
      "b",
    ]);
  });

  it("过滤归档 / 他人", () => {
    const rows = [
      row("a"),
      row("x", { parentDocument: "a", isArchived: true }),
      row("y", { parentDocument: "a", userId: "u2" }),
      row("z", { parentDocument: "a" }),
    ];
    expect(getChildren(rows, "a", { userId: "u1" }).map((r) => r.id)).toEqual([
      "z",
    ]);
  });

  it("父节点不存在 → 空数组，不抛错", () => {
    expect(getChildren([row("a")], "nope", { userId: "u1" })).toEqual([]);
  });
});

describe("createSidebarIndex —— 一次建索引，反复 O(1) 取子节点", () => {
  it("tree 与 childrenOf 都能用", () => {
    const rows = [
      row("root"),
      row("b", { parentDocument: "root" }),
      row("c", { parentDocument: "root" }),
    ];
    const index = createSidebarIndex(rows, { userId: "u1" });
    expect(index.tree.map((n) => n.id)).toEqual(["root"]);
    expect(index.childrenOf("root").map((r) => r.id)).toEqual(["b", "c"]);
    expect(index.childrenOf(null).map((r) => r.id)).toEqual(["root"]);
  });

  it("未知 parentId → 空数组", () => {
    const index = createSidebarIndex([row("a")], { userId: "u1" });
    expect(index.childrenOf("nope")).toEqual([]);
  });

  it("不修改入参", () => {
    const rows = [row("a"), row("b", { parentDocument: "a" })];
    const before = rows.map((r) => r.id);
    createSidebarIndex(rows, { userId: "u1" });
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});