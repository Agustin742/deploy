import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls once after the delay with the last arguments", () => {
    const fn = vi.fn();
    const d = debounce(fn, 250);
    d(1);
    d(2);
    d(3);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("restarts the timer on every call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    vi.advanceTimersByTime(80);
    d();
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("debounce.cancel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("drops the pending call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it("can be called again after cancelling", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    d.cancel();
    d();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
