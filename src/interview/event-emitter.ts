/**
 * 手撕 01 —— 实现 EventEmitter（on / once / off / emit）
 * 来源：IEG 一面编程题
 *
 * 面试怎么讲：
 *   "核心是用一个对象按事件名存监听器数组。on 追加、emit 遍历触发、off 过滤移除。
 *    两个细节：once 要用包装函数包一层，执行后自己摘掉，同时要能通过原函数 off 掉；
 *    emit 时要对数组做快照，否则回调里增删监听器会导致遍历错乱。"
 *
 * 规则：
 *  1. on(event, fn)  ：订阅，多个监听器按注册顺序触发
 *  2. once(event, fn)：只触发一次，触发后自动移除
 *  3. off(event, fn) ：按「原函数」移除；事件或函数不存在时静默返回，不抛错
 *  4. emit(event, ...args)：触发，参数原样透传给监听器；无监听器时静默返回
 *  5. once 注册过的，用原函数 off 也要能移除（参考 Node 的 EventEmitter 行为）
 *  6. emit 过程中增删监听器不影响本轮遍历（先对数组做快照）
 *
 * 时间复杂度：on/off 为 O(k)（k = 该事件监听器数），emit 为 O(k)
 *
 *
 */
export class EventEmitter {
  on(event: string, fn: (...args: unknown[]) => void): void {
    throw new Error("on 还没实现");
  }

  once(event: string, fn: (...args: unknown[]) => void): void {
    throw new Error("once 还没实现");
  }

  off(event: string, fn: (...args: unknown[]) => void): void {
    throw new Error("off 还没实现");
  }

  emit(event: string, ...args: unknown[]): void {
    throw new Error("emit 还没实现");
  }
}
