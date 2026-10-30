import { describe, expect, it } from "vitest";
import { DocumentCache } from "@/src/data/document-cache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("DocumentCache —— 并发去重", () => {
  it("同一 id 的并发请求共用一个 Promise，只加载一次", async () => {
    const cache = new DocumentCache<string>();
    const gate = deferred<string>();
    let calls = 0;

    const first = cache.get("doc-1", () => {
      calls++;
      return gate.promise;
    });
    const second = cache.get("doc-1", () => {
      calls++;
      return "fallback";
    });

    expect(second).toBe(first);
    gate.resolve("正文");
    await expect(first).resolves.toBe("正文");
    expect(calls).toBe(1);
  });

  it("不同 id 各自加载，不会互相复用", async () => {
    const cache = new DocumentCache<string>();
    const calls: string[] = [];

    await Promise.all([
      cache.get("a", async (id) => {
        calls.push(id);
        return "A";
      }),
      cache.get("b", async (id) => {
        calls.push(id);
        return "B";
      }),
    ]);

    expect(calls.sort()).toEqual(["a", "b"]);
  });

  it("加载失败不会被缓存，下一次可以重试", async () => {
    const cache = new DocumentCache<string>();
    let calls = 0;

    await expect(
      cache.get("doc-1", async () => {
        calls++;
        throw new Error("network");
      }),
    ).rejects.toThrow("network");

    expect(cache.has("doc-1")).toBe(false);
    await expect(cache.get("doc-1", async () => "ok")).resolves.toBe("ok");
    expect(calls).toBe(1);
  });

  it("并发请求共享同一次失败", async () => {
    const cache = new DocumentCache<string>();
    const gate = deferred<string>();
    let calls = 0;

    const first = cache.get("doc-1", () => {
      calls++;
      return gate.promise;
    });
    const second = cache.get("doc-1", () => "other");

    expect(second).toBe(first);
    gate.reject(new Error("timeout"));
    await expect(first).rejects.toThrow("timeout");
    await expect(second).rejects.toThrow("timeout");
    expect(calls).toBe(1);
    expect(cache.has("doc-1")).toBe(false);
  });
});

describe("DocumentCache —— 内存缓存", () => {
  it("第二次读取直接命中缓存，不再调用 fetcher", async () => {
    const cache = new DocumentCache<{ title: string }>();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return { title: "性能优化" };
    };

    const first = await cache.get("doc-1", fetcher);
    const second = await cache.get("doc-1", fetcher);

    expect(second).toBe(first);
    expect(calls).toBe(1);
    expect(cache.size).toBe(1);
  });

  it("undefined 也是合法结果，可以正常命中", async () => {
    const cache = new DocumentCache<undefined>();
    let calls = 0;

    await cache.get("doc-1", () => {
      calls++;
      return undefined;
    });
    await cache.get("doc-1", () => {
      calls++;
      return undefined;
    });

    expect(calls).toBe(1);
    expect(cache.has("doc-1")).toBe(true);
  });

  it("invalidate 后重新加载", async () => {
    const cache = new DocumentCache<string>();
    let version = 1;

    expect(await cache.get("doc-1", async () => `v${version}`)).toBe("v1");
    cache.invalidate("doc-1");
    version = 2;
    expect(await cache.get("doc-1", async () => `v${version}`)).toBe("v2");
  });

  it("invalidate 正在加载的请求时，旧响应不会回填缓存", async () => {
    const cache = new DocumentCache<string>();
    const oldGate = deferred<string>();

    const oldRequest = cache.get("doc-1", () => oldGate.promise);
    cache.invalidate("doc-1");
    const newRequest = cache.get("doc-1", async () => "new");

    await expect(newRequest).resolves.toBe("new");
    oldGate.resolve("old");
    await expect(oldRequest).resolves.toBe("old");

    expect(cache.has("doc-1")).toBe(true);
    await expect(cache.get("doc-1", async () => "unexpected")).resolves.toBe(
      "new",
    );
  });

  it("clear 清空缓存，并阻止旧请求回填", async () => {
    const cache = new DocumentCache<string>();
    const gate = deferred<string>();

    const request = cache.get("doc-1", () => gate.promise);
    cache.clear();
    gate.resolve("old");
    await expect(request).resolves.toBe("old");

    expect(cache.size).toBe(0);
    expect(cache.has("doc-1")).toBe(false);
  });
});

describe("DocumentCache —— LRU 上限", () => {
  it("超过容量时淘汰最久未使用的条目", async () => {
    const cache = new DocumentCache<string>(2);
    await cache.get("a", async () => "A");
    await cache.get("b", async () => "B");
    await cache.get("c", async () => "C");

    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
    expect(cache.size).toBe(2);
  });

  it("读取命中会刷新最近使用顺序", async () => {
    const cache = new DocumentCache<string>(2);
    await cache.get("a", async () => "A");
    await cache.get("b", async () => "B");
    await cache.get("a", async () => "unexpected");
    await cache.get("c", async () => "C");

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
  });

  it("capacity = 0 时不保留结果，但仍会合并并发请求", async () => {
    const cache = new DocumentCache<string>(0);
    const gate = deferred<string>();
    let calls = 0;
    let reloads = 0;

    const first = cache.get("doc-1", () => {
      calls++;
      return gate.promise;
    });
    const second = cache.get("doc-1", () => "other");
    expect(second).toBe(first);

    gate.resolve("ok");
    await Promise.all([first, second]);
    expect(calls).toBe(1);
    expect(cache.size).toBe(0);

    await expect(
      cache.get("doc-1", async () => {
        reloads++;
        return "reload";
      }),
    ).resolves.toBe("reload");
    expect(calls).toBe(1);
    expect(reloads).toBe(1);
  });

  it("容量必须是合法的非负整数", () => {
    expect(() => new DocumentCache(-1)).toThrow(RangeError);
    expect(() => new DocumentCache(1.5)).toThrow(RangeError);
    expect(() => new DocumentCache(Number.NaN)).toThrow(RangeError);
  });
});
