/**
 * Day 7 · 侧边栏取数：全量建树 vs 懒加载
 *
 * 对应 Lotion：`document-list.tsx` 把 `getSidebarAll()` 拉回的扁平数组
 * 还原成树；展开某个节点时，再按 `parentDocument` 拉下一层。
 *
 * 两种模式：
 *   1. 全量：一次拉回所有可见文档 → 内存建树 O(n)，首屏一次 RTT；
 *   2. 懒加载：只拉当前层 → 展开时再查，首屏快但每层一次请求。
 * 生产里常用「首屏拉两层 + 展开时懒加载」的混合策略。
 */
import { buildTree, type TreeNode } from "@/src/tree";
import {
  indexByParent,
  selectSidebarRows,
  type DocumentRow,
  type SidebarQuery,
} from "./documents";

/**
 * 全量模式：过滤 → 排序 → 建树。
 *
 * 适用：文档总量不大（几千条以内），或者侧边栏只展示「最近更新 + 收藏」。
 * 代价：一次要把所有行拉回内存，文档量大时首屏 payload 会很难看。
 */
export function getSidebarTree(
  rows: readonly DocumentRow[],
  query: SidebarQuery,
): TreeNode[] {
  return buildTree(selectSidebarRows(rows, query));
}

/**
 * 懒加载模式：只取某个节点的**直接子节点**。
 *
 * 对应 SQL：`where user_id = ? and parent_document = ? order by updated_at desc`
 * 走 `(user_id, parent_document)` 索引；`parentId = null` 取根节点。
 *
 * 注意：这里为了纯函数好测，是在内存里过滤；真实实现应该是数据库按需查。
 */
export function getChildren(
  rows: readonly DocumentRow[],
  parentId: string | null,
  query: SidebarQuery,
): DocumentRow[] {
  return selectSidebarRows(rows, query).filter(
    (row) => row.parentDocument === parentId,
  );
}

/**
 * 内存索引模式：一次扫描建好 `parentId -> 子节点[]`，之后每次展开是 O(1)。
 *
 * 适合「全量已经拉回来了，但不想每次展开都重新 filter 一遍」的场景。
 * 返回的 `childrenOf` 是只读视图：数组本身是新数组，不会影响入参。
 */
export function createSidebarIndex(
  rows: readonly DocumentRow[],
  query: SidebarQuery,
): {
  tree: TreeNode[];
  childrenOf: (parentId: string | null) => DocumentRow[];
} {
  const visible = selectSidebarRows(rows, query);
  const byParent = indexByParent(visible);

  return {
    tree: buildTree(visible),
    childrenOf: (parentId) => byParent.get(parentId) ?? [],
  };
}