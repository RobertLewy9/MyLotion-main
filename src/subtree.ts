/**
 * Day 2 —— 一次算出「整棵子树」
 *
 * 背景（对应 Lotion 的真实代码）：
 *   D:\Codex_Project\lotion-main\lib\db.ts 里，archive() / restore() 是这么递归的：
 *
 *     const { data: children } = await supabase()
 *       .from("documents").select("id")
 *       .eq("userId", userId).eq("parentDocument", id);   // ← 一次网络往返
 *     if (children) {
 *       for (const child of children) await archive(userId, child.id);
 *     }
 *
 *   每往下走一层就发一次查询 —— 一个 100 节点、5 层深的文档，
 *   归档一次要上百次网络往返（典型的 N+1），又慢，又可能中途失败留下半截状态。
 *
 *   但 Day 1 的 getSidebarAll() 早就把整棵树当成扁平数组一次拉回来了 ——
 *   那「某文档的全部后代」完全可以在内存里 O(n) 算出来，
 *   再拿这一串 id 做「一次」批量更新：.in("id", ids)。
 *
 * 题目：给定扁平数组 + 一个根 id，返回它全部后代的 id。
 *
 * 规则：
 *  1. 返回 rootId 的所有后代 id（子、孙、曾孙…），**不含 rootId 自身**
 *  2. 顺序：广度优先（BFS，逐层展开）；同一层按 docs 中的相对顺序
 *  3. rootId 不在 docs 里 → 返回 []（不抛错，方便调用方无脑调用）
 *  4. rootId 没有后代 → 返回 []
 *  5. 纯函数：不允许修改传入的数组或对象
 *  6. 防环：数据损坏导致 a→b→a 时不能死循环，每个 id 最多出现一次
 *
 * 提示：先建一张「父 id → 子节点列表」的索引；BFS 用「队列 + 已访问集合」。
 *   记得把 rootId 一开始就放进已访问集合，否则成环时会把 root 自己收进来。
 *
 * 时间复杂度：O(n)   空间复杂度：O(n)
 *
 * TODO: 你来实现（把下面这行替换掉）
 */
import type { SidebarDocument } from "./tree";

export function collectSubtreeIds(docs: SidebarDocument[], rootId: string): string[] {
  
  const childrenMap=new Map<string,SidebarDocument[]>();
  for(const doc of docs){
    const parentId=doc.parentDocument;
    if(parentId===null)
      {
        continue;
      }

    if(!childrenMap.has(parentId)){
       childrenMap.set(parentId,[]);
    }
    childrenMap.get(parentId)!.push(doc);
  }

  const rootExists=docs.some(doc=>doc.id===rootId);

  if(!rootExists){
    return [];
  }

  const queue:string[] =[rootId];
  const visited=new Set<string>();
  visited.add(rootId);
  const result:string[]=[];


  while(queue.length>0){
    const currentId=queue.shift()!;
    const children=childrenMap.get(currentId)??[];

    for(const child of children){
      if(visited.has(child.id)){
        continue;
      }

      visited.add(child.id);
      result.push(child.id);
      queue.push(child.id);
    }

  }
  return result;
}
