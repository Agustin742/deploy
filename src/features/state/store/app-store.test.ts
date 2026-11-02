import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "../domain/__fixtures__/sample-state.json";
import { blank, STORAGE_KEY } from "../domain/state";
import type { AppState } from "../domain/types";
import { createAppStore } from "./app-store";
import type { StorageLike } from "./persistence";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  const setItem = vi.fn((k: string, v: string) => {
    data[k] = v;
  });
  const storage: StorageLike = { getItem: (k) => (k in data ? data[k] : null), setItem };
  return { data, setItem, storage };
};

const TODAY = "2026-03-11";
const setGoal = (goal: number) => (s: AppState): AppState => ({ ...s, goal, goalSet: true });

describe("app store", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts blank and not loaded", () => {
    const { storage } = memoryStorage();
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    expect(store.getState().state).toEqual(blank());
    expect(store.getState().loaded).toBe(false);
  });

  it("loads the saved state from storage", () => {
    const saved = { ...blank(), ...sample };
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) });
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().load();
    expect(store.getState().loaded).toBe(true);
    expect(store.getState().state.apps).toHaveLength(7);
    expect(store.getState().state.goal).toBe(10);
  });

  it("does not write during load", () => {
    const { storage, setItem } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(blank()) });
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().load();
    vi.advanceTimersByTime(1000);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("applies updates immediately in memory and saves after the debounce", () => {
    const { storage, setItem, data } = memoryStorage();
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().update(setGoal(5));
    expect(store.getState().state.goal).toBe(5);
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(249);
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(data[STORAGE_KEY]).goal).toBe(5);
  });

  it("coalesces rapid updates into one save with the latest state", () => {
    const { storage, setItem, data } = memoryStorage();
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().update(setGoal(1));
    vi.advanceTimersByTime(100);
    store.getState().update(setGoal(2));
    vi.advanceTimersByTime(100);
    store.getState().update(setGoal(3));
    vi.advanceTimersByTime(250);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(data[STORAGE_KEY]).goal).toBe(3);
  });

  it("saves right away for immediate updates and cancels the pending debounce", () => {
    const { storage, setItem, data } = memoryStorage();
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().update(setGoal(1));
    store.getState().update(setGoal(9), { immediate: true });
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(data[STORAGE_KEY]).goal).toBe(9);
    vi.advanceTimersByTime(1000);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("saveNow flushes the current state", () => {
    const { storage, data } = memoryStorage();
    const store = createAppStore({ storage: () => storage, today: () => TODAY });
    store.getState().update(setGoal(4));
    store.getState().saveNow();
    expect(JSON.parse(data[STORAGE_KEY]).goal).toBe(4);
  });

  it("round-trips: a new store loads what the previous one saved", () => {
    const { storage } = memoryStorage();
    const first = createAppStore({ storage: () => storage, today: () => TODAY });
    first.getState().update((s) => ({ ...s, profile: { ...s.profile, cv: "Zoe Lopez\nQA" } }));
    first.getState().update(setGoal(6));
    vi.advanceTimersByTime(250);
    const second = createAppStore({ storage: () => storage, today: () => TODAY });
    second.getState().load();
    expect(second.getState().state.goal).toBe(6);
    expect(second.getState().state.profile.name).toBe("Zoe Lopez");
  });

  it("keeps working in memory when there is no storage", () => {
    const store = createAppStore({ storage: () => null, today: () => TODAY });
    store.getState().load();
    store.getState().update(setGoal(2));
    vi.advanceTimersByTime(300);
    expect(store.getState().state.goal).toBe(2);
  });

  describe("importBackup", () => {
    it("restores a valid backup, syncs the name and saves immediately", () => {
      const { storage, data } = memoryStorage();
      const store = createAppStore({ storage: () => storage, today: () => TODAY });
      const ok = store
        .getState()
        .importBackup({ ...blank(), apps: [], profile: { ...blank().profile, cv: "Ana Gomez\nDev" }, goal: 3, goalSet: true });
      expect(ok).toBe(true);
      expect(store.getState().state.goal).toBe(3);
      expect(store.getState().state.profile.name).toBe("Ana Gomez");
      expect(JSON.parse(data[STORAGE_KEY]).profile.name).toBe("Ana Gomez");
    });

    it("rejects data that is not a backup and leaves the state untouched", () => {
      const { storage, setItem } = memoryStorage();
      const store = createAppStore({ storage: () => storage, today: () => TODAY });
      store.getState().update(setGoal(8));
      expect(store.getState().importBackup({ nope: true })).toBe(false);
      expect(store.getState().importBackup(null)).toBe(false);
      expect(store.getState().importBackup({ apps: "x" })).toBe(false);
      expect(store.getState().state.goal).toBe(8);
      vi.advanceTimersByTime(300);
      expect(setItem).toHaveBeenCalledTimes(1);
    });
  });
});
