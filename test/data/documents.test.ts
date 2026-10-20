import { describe, expect, it } from "vitest";
import {
  indexByParent,
  selectSidebarRows,
  type DocumentRow,
} from "@/src/data/documents";
import { buildTree } from "@/src/tree";

function row(
  id: string,
  overrides: Partial<DocumentRow> = {},
): DocumentRow {
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

describe("selectSidebarRows —— 用户隔离 / 归档过滤 / 稳定排序", () => {
  it("只返回当前用户的文档", () => {
    const rows = [row("a"), row("b", { userId: "u2" }), row("c")];
    expect(selectSidebarRows(rows, { userId: "u1" }).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("默认过滤归档文档", () => {
    const rows = [row("a"), row("b", { isArchived: true })];
    expect(selectSidebarRows(rows, { userId: "u1" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("includeArchived 为 true 时保留归档文档", () => {
    const rows = [row("a"), row("b", { isArchived: true })];
    expect(
      selectSidebarRows(rows, { userId: "u1", includeArchived: true }).map((r) => r.id),
    ).toEqual(["a", "b"]);
  });

  it("按 updatedAt 降序", () => {
    const rows = [
      row("old", { updatedAt: "2026-01-01T00:00:00.000Z" }),
      row("new", { updatedAt: "2026-03-01T00:00:00.000Z" }),
      row("mid", { updatedAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(selectSidebarRows(rows, { userId: "u1" }).map((r) => r.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("updatedAt 相同则按 createdAt 降序", () => {
    const rows = [
      row("a", { createdAt: "2026-01-01T00:00:00.000Z" }),
      row("b", { createdAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(selectSidebarRows(rows, { userId: "u1" }).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("两个时间都相同则按 id 升序，保证顺序确定", () => {
    const rows = [row("c"), row("a"), row("b")];
    expect(selectSidebarRows(rows, { userId: "u1" }).map((r) => r.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("不修改入参，返回新数组", () => {
    const rows = [row("a", { updatedAt: "2026-01-01T00:00:00.000Z" }), row("b")];
    const before = rows.map((r) => r.id);
    const result = selectSidebarRows(rows, { userId: "u1" });
    expect(result).not.toBe(rows);
    expect(rows.map((r) => r.id)).toEqual(before);
  });

  it("空数组 → 空数组", () => {
    expect(selectSidebarRows([], { userId: "u1" })).toEqual([]);
  });
});

describe("indexByParent —— 一次扫描建父 → 子索引", () => {
  it("按 parentDocument 分组，根节点归到 null", () => {
    const rows = [row("a"), row("b", { parentDocument: "a" }), row("c", { parentDocument: "a" })];
    const index = indexByParent(rows);
    expect(index.get(null)?.map((r) => r.id)).toEqual(["a"]);
    expect(index.get("a")?.map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("保持传入顺序", () => {
    const rows = [row("c", { parentDocument: "a" }), row("b", { parentDocument: "a" })];
    expect(indexByParent(rows).get("a")?.map((r) => r.id)).toEqual(["c", "b"]);
  });

  it("空数组 → 空 Map", () => {
    expect(indexByParent([]).size).toBe(0);
  });
});

describe("数据层 + 树还原（Day 1 串联）", () => {
  it("取数、排序、建树一条链走通", () => {
    const rows = [
      row("root", { updatedAt: "2026-03-01T00:00:00.000Z" }),
      row("child", { parentDocument: "root", updatedAt: "2026-02-01T00:00:00.000Z" }),
      row("archived", { isArchived: true, updatedAt: "2026-04-01T00:00:00.000Z" }),
      row("other-user", { userId: "u2" }),
    ];

    const visible = selectSidebarRows(rows, { userId: "u1" });
    const tree = buildTree(visible);

    expect(tree.map((n) => n.id)).toEqual(["root"]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["child"]);
  });
});