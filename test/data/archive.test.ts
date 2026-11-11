import { describe, expect, it } from "vitest";
import { applyArchivePlan, planArchiveRestore } from "@/src/data/archive";
import type { DocumentRow } from "@/src/data/documents";

function row(id: string, parentDocument: string | null = null, isArchived = false): DocumentRow {
  return {
    id,
    title: `标题-${id}`,
    parentDocument,
    userId: "u1",
    isPublished: false,
    isArchived,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("planArchiveRestore —— 子树批量归档 / 恢复", () => {
  it("根节点不存在 → null", () => {
    expect(planArchiveRestore([row("a")], "missing", "archive")).toBeNull();
  });

  it("归档包含根和全部后代，不含旁支", () => {
    const plan = planArchiveRestore(
      [row("a"), row("b", "a"), row("c", "b"), row("x")],
      "a",
      "archive",
    );
    expect(plan?.ids).toEqual(["a", "b", "c"]);
  });

  it("恢复时父节点可见 → 保留原父节点", () => {
    const plan = planArchiveRestore([row("a"), row("b", "a", true)], "b", "restore");
    expect(plan).toMatchObject({ rootParentDocument: "a", detached: false });
  });

  it("恢复时父节点已归档 → 子树根脱钩", () => {
    const plan = planArchiveRestore(
      [row("a", null, true), row("b", "a", true), row("c", "b", true)],
      "b",
      "restore",
    );
    expect(plan).toMatchObject({ ids: ["b", "c"], rootParentDocument: null, detached: true });
  });

  it("恢复时祖先已归档 → 也要脱钩", () => {
    const plan = planArchiveRestore(
      [row("a", null, true), row("b", "a"), row("c", "b", true)],
      "c",
      "restore",
    );
    expect(plan).toMatchObject({ rootParentDocument: null, detached: true });
  });

  it("父节点缺失或父链成环 → 脱钩且不死循环", () => {
    const orphan = planArchiveRestore([row("o", "gone", true)], "o", "restore");
    const cycle = planArchiveRestore(
      [row("a", "b", true), row("b", "a", true), row("c", "a", true)],
      "c",
      "restore",
    );
    expect(orphan).toMatchObject({ rootParentDocument: null, detached: true });
    expect(cycle).toMatchObject({ rootParentDocument: null, detached: true });
  });

  it("批量归档整棵子树，不改原数组", () => {
    const rows = [row("a"), row("b", "a"), row("x")];
    const before = JSON.stringify(rows);
    const next = applyArchivePlan(rows, planArchiveRestore(rows, "a", "archive")!);
    expect(next.filter((item) => item.isArchived).map((item) => item.id)).toEqual(["a", "b"]);
    expect(JSON.stringify(rows)).toBe(before);
  });

  it("恢复脱钩只改子树根，子节点仍挂在根下", () => {
    const rows = [row("a", null, true), row("b", "a", true), row("c", "b", true)];
    const next = applyArchivePlan(rows, planArchiveRestore(rows, "b", "restore")!);
    expect(next.find((item) => item.id === "b")).toMatchObject({
      parentDocument: null,
      isArchived: false,
    });
    expect(next.find((item) => item.id === "c")).toMatchObject({
      parentDocument: "b",
      isArchived: false,
    });
  });
});
