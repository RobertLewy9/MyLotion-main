import { describe, expect, it } from "vitest";
import { buildTree, type SidebarDocument } from "@/src/tree";

/** 造数据的小工具：省得每个用例都把字段写全 */
function doc(id: string, parentDocument: string | null = null): SidebarDocument {
  return {
    id,
    title: `标题-${id}`,
    parentDocument,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildTree —— 扁平数组还原成文档树", () => {
  it("空数组 → 空树", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("单个根节点，children 是空数组", () => {
    const tree = buildTree([doc("a")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("a");
    expect(tree[0].children).toEqual([]);
  });

  it("多个根节点，保持传入顺序", () => {
    const tree = buildTree([doc("a"), doc("b"), doc("c")]);
    expect(tree.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("子节点挂到父节点的 children 下", () => {
    const tree = buildTree([doc("a"), doc("b", "a")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((n) => n.id)).toEqual(["b"]);
  });

  it("支持任意深度嵌套", () => {
    const tree = buildTree([doc("a"), doc("b", "a"), doc("c", "b"), doc("d", "c")]);
    expect(tree[0].children[0].children[0].children[0].id).toBe("d");
  });

  it("同级子节点保持传入顺序", () => {
    const tree = buildTree([doc("a"), doc("b", "a"), doc("c", "a"), doc("d", "a")]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["b", "c", "d"]);
  });

  it("父节点在数组里排在子节点后面，也要能挂上", () => {
    const tree = buildTree([doc("b", "a"), doc("a")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((n) => n.id)).toEqual(["b"]);
  });

  it("父节点不存在时（孤儿节点）提升为根节点，不能凭空消失", () => {
    const tree = buildTree([doc("a"), doc("orphan", "这个id不存在")]);
    expect(tree.map((n) => n.id).sort()).toEqual(["a", "orphan"]);
  });

  it("纯函数：不修改传入的数组和对象", () => {
    const input = [doc("a"), doc("b", "a")];
    const before = JSON.stringify(input);
    buildTree(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("返回的节点必须是新对象，不能复用传入的对象引用", () => {
    const input = [doc("a"), doc("b", "a")];
    const tree = buildTree(input);
    expect(tree[0]).not.toBe(input[0]);
    expect(tree[0].children[0]).not.toBe(input[1]);
  });
});
