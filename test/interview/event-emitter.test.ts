import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "@/src/interview/event-emitter";

describe("EventEmitter —— 手撕 01（IEG 一面）", () => {
  it("on + emit：订阅后能收到事件", () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on("foo", fn);
    ee.emit("foo");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("emit 的参数原样透传给监听器", () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on("foo", fn);
    ee.emit("foo", 1, "a", { b: 2 });
    expect(fn).toHaveBeenCalledWith(1, "a", { b: 2 });
  });

  it("多个监听器按注册顺序触发", () => {
    const ee = new EventEmitter();
    const order: number[] = [];
    ee.on("foo", () => order.push(1));
    ee.on("foo", () => order.push(2));
    ee.on("foo", () => order.push(3));
    ee.emit("foo");
    expect(order).toEqual([1, 2, 3]);
  });

  it("emit 一个没有监听器的事件不报错", () => {
    const ee = new EventEmitter();
    expect(() => ee.emit("nobody")).not.toThrow();
  });

  it("off：按原函数移除监听器", () => {
    const ee = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    ee.on("foo", a);
    ee.on("foo", b);
    ee.off("foo", a);
    ee.emit("foo");
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("off：事件不存在或函数不存在时静默返回，不抛错", () => {
    const ee = new EventEmitter();
    expect(() => ee.off("nobody", () => {})).not.toThrow();
    ee.on("foo", () => {});
    expect(() => ee.off("foo", () => {})).not.toThrow();
  });

  it("once：只触发一次", () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once("foo", fn);
    ee.emit("foo");
    ee.emit("foo");
    ee.emit("foo");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("once：参数同样透传", () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once("foo", fn);
    ee.emit("foo", "hi");
    expect(fn).toHaveBeenCalledWith("hi");
  });

  it("once 注册的监听器，用原函数也能 off 掉（Node 的行为）", () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once("foo", fn);
    ee.off("foo", fn);
    ee.emit("foo");
    expect(fn).not.toHaveBeenCalled();
  });

  it("emit 过程中移除监听器，不影响本轮遍历（快照语义）", () => {
    const ee = new EventEmitter();
    const second = vi.fn();
    ee.on("foo", () => ee.off("foo", second));
    ee.on("foo", second);
    ee.emit("foo");
    expect(second).toHaveBeenCalledTimes(1); // 本轮仍触发，下一轮才不触发
    ee.emit("foo");
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("once：原函数里重新 emit 同一个事件，不会重入", () => {
    const ee = new EventEmitter();
    let count = 0;
    ee.once("tick", () => {
      count++;
      if (count < 5) ee.emit("tick");
    });
    ee.emit("tick");
    expect(count).toBe(1); // 先摘再跑：内层 emit 时监听器已移除
  });

  it("emit 过程中新增监听器，本轮不触发（快照语义）", () => {
    const ee = new EventEmitter();
    const late = vi.fn();
    let added = false;
    ee.on("foo", () => {
      if (added) return;
      added = true;
      ee.on("foo", late);
    });
    ee.emit("foo");
    expect(late).not.toHaveBeenCalled(); // 本轮触发集合已经定死
    ee.emit("foo");
    expect(late).toHaveBeenCalledTimes(1); // 下一轮才参与
  });
});