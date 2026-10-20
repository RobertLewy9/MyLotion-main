/**
 * Day 6 · 数据层：documents 单表取数
 *
 * 对应 Lotion：`lib/db.ts` 的 `getSidebarAll()` —— 一次把当前用户可见的文档全量拉回来，
 * 前端再用 `buildTree()` 还原成树（Day 1）。
 *
 * 单表设计（PostgreSQL）：
 *   documents(id, title, parentDocument, userId, isPublished, isArchived, content, createdAt, updatedAt)
 *   其中 parentDocument 自引用 documents.id，NULL 表示根节点。
 *
 * 索引：
 *   (userId, parentDocument) —— 按用户 + 父节点取子节点（懒加载 / 子树查询）
 *   (userId, updatedAt DESC) —— 侧边栏按最近更新排序
 *   (userId, isArchived)     —— 过滤归档（部分索引更省）
 */

export interface DocumentRow {
  id: string;
  title: string;
  parentDocument: string | null;
  userId: string;
  isPublished: boolean;
  isArchived: boolean;
  /** ISO 8601，例如 2026-10-20T08:00:00.000Z */
  createdAt: string;
  updatedAt: string;
}

export interface SidebarQuery {
  userId: string;
  /** 默认不返回归档文档；显式传 true 才带出来 */
  includeArchived?: boolean;
}

/**
 * 侧边栏取数：按用户隔离 → 过滤归档 → 稳定排序。
 *
 * 排序规则（与 Lotion 一致）：
 *   updatedAt 降序 → createdAt 降序 → id 升序
 * 后两级是**决胜规则**，保证同一时间戳下顺序确定，不会因为数组顺序抖动。
 *
 * 纯函数：不改入参，返回新数组。
 */
export function selectSidebarRows(
  rows: readonly DocumentRow[],
  query: SidebarQuery,
): DocumentRow[] {
  const includeArchived = query.includeArchived ?? false;

  return rows
    .filter((row) => row.userId === query.userId)
    .filter((row) => includeArchived || !row.isArchived)
    .slice()
    .sort(compareRows);
}

function compareRows(a: DocumentRow, b: DocumentRow): number {
  // ISO 8601 同格式下可直接按字符串比较，等价于按时间比较
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * 按 parentDocument 建索引：一次 O(n) 扫描，之后找「某节点的直接子节点」是 O(1)。
 * 根节点（parentDocument === null）也会有一组。
 *
 * 保持传入顺序 —— 排序应该由调用方（selectSidebarRows）负责，索引只负责分组。
 */
export function indexByParent(
  rows: readonly DocumentRow[],
): Map<string | null, DocumentRow[]> {
  const index = new Map<string | null, DocumentRow[]>();

  for (const row of rows) {
    const siblings = index.get(row.parentDocument);
    if (siblings) siblings.push(row);
    else index.set(row.parentDocument, [row]);
  }

  return index;
}