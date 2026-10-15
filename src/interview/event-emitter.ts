/**
 * 手撕 01 —— 实现 EventEmitter（on / once / off / emit）
 * 来源：IEG 一面编程题
 *
 * 面试怎么讲（30 秒版）：
 *   "核心是一个 Map：事件名 → 监听器数组。on 追加、emit 遍历触发、off 过滤移除。
 *    有三个细节是面试官会追的：① once 要用包装函数包一层，执行后把自己摘掉；
 *    ② 这个包装函数还要能被『原函数』off 掉，所以我在包装函数上挂了一个 listener
 *    指回原函数，off 时反查；③ emit 必须对数组做快照，否则回调里增删监听器会让
 *    本轮遍历错乱。"
 *
 * 规则：
 *  1. on(event, fn)  ：订阅，多个监听器按注册顺序触发
 *  2. once(event, fn)：只触发一次，触发后自动移除
 *  3. off(event, fn) ：按「原函数」移除；事件或函数不存在时静默返回，不抛错
 *  4. emit(event, ...args)：触发，参数原样透传给监听器；无监听器时静默返回
 *  5. once 注册过的，用原函数 off 也要能移除（参考 Node 的 EventEmitter 行为）
 *  6. emit 过程中增删监听器不影响本轮遍历（先对数组做快照）
 *
 * 时间复杂度：on 为 O(1)，off 为 O(k)，emit 为 O(k)（k = 该事件的监听器数）
 */
type Listener = (...args: unknown[]) => void;

/**
 * once 注册时实际存进数组的是这个包装函数。
 * 它多挂了一个 listener 属性指回「原始函数」——因为 off 是拿原函数来删的，
 * 光看包装函数认不出它是谁注册的。
 */
type OnceWrapper = Listener & { listener: Listener };

function isOnceWrapper(cb: Listener): cb is OnceWrapper {
  return typeof (cb as Partial<OnceWrapper>).listener === "function";
}

export class EventEmitter {
  /** 事件名 → 监听器数组（用 Map 而不是普通对象，避免 __proto__ 之类的键名坑） */
  private readonly events = new Map<string, Listener[]>();

  /** 订阅：同一个事件可以注册多个监听器，按注册顺序触发 */
  on(event: string, fn: Listener): void {
    const list = this.events.get(event);
    if (list) {
      list.push(fn);
    } else {
      this.events.set(event, [fn]);
    }
  }

  /**
   * 只订阅一次：存进数组的其实是一个包装函数。
   * 面试记忆：once 通过包装函数实现只执行一次，并在执行原始回调前移除监听器，避免重入。
   */
  once(event: string, fn: Listener): void {
    const wrapper = ((...args: unknown[]) => {
      this.off(event, fn);
      fn(...args);
    }) as OnceWrapper;
    wrapper.listener = fn;//是为了让包装函数保留原始函数的身份信息，方便 off 根据原始函数取消订阅。
    this.on(event, wrapper);
  }

  /**
   * 取消订阅：按「原函数」删。
   * 要同时匹配两种情况：① 直接 on 进去的（cb === fn）；
   * ② once 包了一层 wrapper 的（wrapper.listener === fn）。
   */
  off(event: string, fn: Listener): void {
    const list = this.events.get(event);
    if (!list) return;

    const next = list.filter(
      (cb) => cb !== fn && !(isOnceWrapper(cb) && cb.listener === fn),
    );

    // 该事件已经没有监听器了就把这个 事件的key 删掉，别留空数组越堆越多
    if (next.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, next);
    }
  }

  /** 触发：参数原样透传；无监听器时静默返回 */
  emit(event: string, ...args: unknown[]): void {
    const list = this.events.get(event);
    if (!list || list.length === 0) return;

    // 快照：先复制一份再遍历，这样回调里 on/off 不会影响本轮触发顺序，
    // 也不会出现「边遍历边改数组」导致的跳过或重复
    for (const fn of [...list]) {
      fn(...args);
    }
  }
}


const emitter=new EventEmitter();
emitter.once("message",()=>{
  console.log("收到消息");

  // 在这个回调里面，再次触发同一个事件！
  emitter.emit("message");
});