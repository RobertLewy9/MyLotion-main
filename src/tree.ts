/**
 * Day 1 —— 把扁平数组还原成文档树
 *
 * 背景（对应 Lotion 的真实代码）：
 *   documents 表用 parentDocument 自引用实现「无限层级」。
 *   D:\Codex_Project\lotion-main\lib\db.ts 的 getSidebarAll() 一次性把
 *   全部文档当扁平数组拉回来（避免 N 次查询），前端再还原成树。
 *   Lotion 是在 document-list.tsx 里靠递归 filter 做的 —— 等你自己写完之后
 *   再去对照，看看两种做法的复杂度差多少。
 */

/** 侧边栏用的文档（对应 Lotion 的 SidebarDocument，不含正文所以更轻） */
export interface SidebarDocument {
  id: string;
  title: string;
  /** 父文档 id；null 表示这是根节点 */
  parentDocument: string | null;
  createdAt: string;
}

/** 树节点 = 文档本身的字段 + 它的子节点 */
export interface TreeNode extends SidebarDocument {
  children: TreeNode[];
}

/**
 * 把扁平数组还原成嵌套树。
 *
 * 规则：
 *  1. parentDocument === null 的文档是根节点
 *  2. 其余文档挂到 parentDocument 对应节点的 children 里
 *  3. 同级节点保持传入数组的相对顺序
 *  4. parentDocument 指向不存在的文档时，该文档提升为根节点（不能凭空消失）
 *  5. 纯函数：不允许修改传入的数组或对象
 *
 * 提示：先想想如果用递归 filter 会是什么复杂度，有没有 O(n) 的做法。
 *
 * TODO: 你来实现（把下面这行替换掉）
 */
export function buildTree(docs: SidebarDocument[]): TreeNode[] {
  throw new Error("buildTree 还没实现");
}
