// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "../domain/state";
import { appStore, useAppStore } from "./use-app-store";

describe("useAppStore (browser localStorage)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    appStore.setState({ loaded: false });
  });
  afterEach(() => vi.useRealTimers());

  it("loads from window.localStorage and exposes state to components", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal: 12, goalSet: true }));
    const { result } = renderHook(() => useAppStore((s) => s.state.goal));
    expect(result.current).toBe(0);
    act(() => appStore.getState().load());
    expect(result.current).toBe(12);
  });

  it("persists updates to window.localStorage after the debounce", () => {
    const { result } = renderHook(() => useAppStore((s) => s.state.goal));
    act(() => appStore.getState().update((s) => ({ ...s, goal: 4, goalSet: true })));
    expect(result.current).toBe(4);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string).goal).toBe(4);
  });
});
