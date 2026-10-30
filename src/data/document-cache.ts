/**
 * Day 8 · 文档详情缓存：并发请求去重 + LRU 上限
 *
 * 对应 Lotion：`getById()` 被详情页、AI 工具、订阅回调同时调用时，
 * 同一个文档在短时间内可能触发多次网络请求。这里做两件事：
 *   1. pending：同一个 id 的并发请求共用一个 Promise；
 *   2. cache：成功结果留在内存里，再次读取直接命中；超过 capacity 按 LRU 淘汰。
 *
 * 不缓存失败结果：失败可能只是瞬时网络问题，下一次调用应允许重试。
 * 失效时同时清掉 cache 和 pending，避免旧请求晚到后把过期数据写回缓存。
 */

type Fetcher<T> = (id: string) => T | Promise<T>;

export class DocumentCache<T> {
  private readonly capacity: number;
  private readonly values = new Map<string, T>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(capacity = 200) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError("capacity must be a non-negative integer");
    }
    this.capacity = capacity;
  }

  /** 当前已缓存的结果数量（不包含正在加载的请求）。 */
  get size(): number {
    return this.values.size;
  }

  /** 只检查已完成的缓存，不会触发加载。 */
  has(id: string): boolean {
    return this.values.has(id);
  }

  /**
   * 读取文档。
   *
   * 命中顺序：
   *   pending 请求 -> 已完成缓存 -> 调 fetcher 加载
   * 命中缓存时会把该条移到 Map 尾部，表示“最近使用”。
   */
  get(id: string, fetcher: Fetcher<T>): Promise<T> {
    const inFlight = this.pending.get(id);
    if (inFlight) return inFlight;

    if (this.values.has(id)) {
      const value = this.values.get(id) as T;
      this.touch(id, value);
      return Promise.resolve(value);
    }

    const request = Promise.resolve().then(() => fetcher(id));
    this.pending.set(id, request);

    request.then(
      (value) => {
        // invalidate/clear 可能已经移除了这条请求，旧响应不能回填缓存。
        if (this.pending.get(id) === request) this.remember(id, value);
      },
      () => {
        // 失败结果不缓存；清理由下面的 finally 统一做。
      },
    ).finally(() => {
      if (this.pending.get(id) === request) this.pending.delete(id);
    });

    return request;
  }

  /** 数据变更后调用：下一次 get 必须重新加载。 */
  invalidate(id: string): void {
    this.values.delete(id);
    this.pending.delete(id);
  }

  /** 清空整个缓存；正在加载的旧响应也不会再回填。 */
  clear(): void {
    this.values.clear();
    this.pending.clear();
  }

  private touch(id: string, value: T): void {
    this.values.delete(id);
    this.values.set(id, value);
  }

  private remember(id: string, value: T): void {
    if (this.capacity === 0) return;

    this.touch(id, value);
    while (this.values.size > this.capacity) {
      const oldest = this.values.keys().next().value;
      if (oldest === undefined) break;
      this.values.delete(oldest);
    }
  }
}
