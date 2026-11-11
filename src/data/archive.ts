import { indexByParent, type DocumentRow } from "./documents";

export type ArchiveAction = "archive" | "restore";

export interface ArchivePlan {
  action: ArchiveAction;
  rootId: string;
  /** 根节点 + 全部后代，顺序为 BFS（父在前、子在后） */
  ids: string[];
  /** 恢复后根节点应写入的 parentDocument；归档时保留原值 */
  rootParentDocument: string | null;
  /** 恢复时原父节点不可见，根节点被提升为顶层 */
  detached: boolean;
}

/**
 * Day 10 —— 归档 / 恢复的批量计划。
 *
 * 目标：把「每层递归查子节点」改成一次 O(n) 内存遍历，随后用 ids 做一次
 * `.in("id", ids)` 批量更新，避免 N+1 网络往返和半截状态。
 *
 * 脱钩规则：恢复一个子树时，如果它的父节点或任一祖先已归档、缺失或形成环，
 * 就把**这个子树的根**挂到顶层（parentDocument = null）；
 * 子树内部父子关系保持不变，否则整棵子树恢复后仍然不可见。
 *
 * 调用方应传入同一个用户的文档行；本函数不负责权限过滤。
 */
export function planArchiveRestore(
  rows: readonly DocumentRow[],
  rootId: string,
  action: ArchiveAction,
): ArchivePlan | null {
  const root = rows.find((row) => row.id === rootId);
  if (!root) return null;

  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenByParent = indexByParent(rows);
  const ids = [rootId];
  const visited = new Set([rootId]);
  const queue = [rootId];

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const parentId = queue[cursor];
    for (const child of childrenByParent.get(parentId) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      queue.push(child.id);
      ids.push(child.id);
    }
  }

  if (action === "archive") {
    return {
      action,
      rootId,
      ids,
      rootParentDocument: root.parentDocument,
      detached: false,
    };
  }

  const parentIsVisible = hasActiveParentChain(byId, root.parentDocument);
  return {
    action,
    rootId,
    ids,
    rootParentDocument: parentIsVisible ? root.parentDocument : null,
    detached: !parentIsVisible,
  };
}

function hasActiveParentChain(
  byId: Map<string, DocumentRow>,
  parentId: string | null,
): boolean {
  if (parentId === null) return true;

  const seen = new Set<string>();
  let current: string | null = parentId;

  while (current !== null) {
    if (seen.has(current)) return false;
    seen.add(current);

    const parent = byId.get(current);
    if (!parent || parent.isArchived) return false;
    current = parent.parentDocument;
  }

  return true;
}

/** 前端乐观更新：按计划返回新数组，不修改入参。 */
export function applyArchivePlan(
  rows: readonly DocumentRow[],
  plan: ArchivePlan,
): DocumentRow[] {
  const affected = new Set(plan.ids);

  return rows.map((row) => {
    if (!affected.has(row.id)) return row;

    const next: DocumentRow = {
      ...row,
      isArchived: plan.action === "archive",
    };

    if (plan.action === "restore" && plan.detached && row.id === plan.rootId) {
      next.parentDocument = plan.rootParentDocument;
    }

    return next;
  });
}
