// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadMyState } from "@/features/sync/infrastructure/actions";
import { blank } from "../domain/state";
import { clearSentCommands, sentCommands } from "./testing";
import { appStore, useAppStore } from "./use-app-store";

describe("useAppStore (synced with the server)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    appStore.setState(appStore.getInitialState(), true);
    clearSentCommands();
    vi.mocked(loadMyState).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("loads the server state and exposes it to components", async () => {
    vi.mocked(loadMyState).mockResolvedValueOnce({ ok: true, state: { ...blank(), goal: 12, goalSet: true } });
    const { result } = renderHook(() => useAppStore((s) => s.state.goal));
    expect(result.current).toBe(0);
    await act(() => appStore.getState().load());
    expect(result.current).toBe(12);
  });

  it("sends updates to the server and never writes the app state to localStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    await act(() => appStore.getState().load());
    const { result } = renderHook(() => useAppStore((s) => s.state.goal));
    act(() => appStore.getState().update((s) => ({ ...s, goal: 4, goalSet: true })));
    expect(result.current).toBe(4);
    expect(sentCommands()).toEqual([]);
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(sentCommands()).toEqual([{ type: "goal.set", goal: 4, goalSet: true }]);
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    setItem.mockRestore();
  });
});
