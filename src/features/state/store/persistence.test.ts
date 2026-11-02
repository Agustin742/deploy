import { describe, expect, it, vi } from "vitest";
import sample from "../domain/__fixtures__/sample-state.json";
import { blank, hydrate, STORAGE_KEY } from "../domain/state";
import { syncProfileName } from "@/features/profile/domain/name";
import { loadState, saveState, type StorageLike } from "./persistence";

const memoryStorage = (initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
};

const TODAY = "2026-03-11";

describe("storage key", () => {
  it("is the same key the legacy artifact used", () => {
    expect(STORAGE_KEY).toBe("radar-postulaciones-v1");
  });
});

describe("loadState", () => {
  it("returns the blank state when nothing was saved", () => {
    expect(loadState(memoryStorage(), TODAY)).toEqual(blank());
  });

  it("returns the blank state when there is no storage", () => {
    expect(loadState(null, TODAY)).toEqual(blank());
  });

  it("loads a legacy saved state through hydrate and the name sync rule", () => {
    const saved = JSON.stringify({ ...blank(), ...sample });
    const expected = hydrate(JSON.parse(saved), TODAY);
    expected.profile = syncProfileName(expected.profile);
    expect(loadState(memoryStorage({ [STORAGE_KEY]: saved }), TODAY)).toEqual(expected);
  });

  it("accepts an old partial shape and fills defaults", () => {
    const saved = JSON.stringify({ apps: [{ id: "x", estado: "Oferta", fecha: "2026-01-01" }] });
    const s = loadState(memoryStorage({ [STORAGE_KEY]: saved }), TODAY);
    expect(s.apps[0].entrevistas).toEqual([]);
    expect(s.platforms).toHaveLength(19);
    expect(s.mods.valores).toBe(false);
  });

  it("derives the name from the CV on load", () => {
    const saved = JSON.stringify({ profile: { cv: "Zoe Lopez\nQA Analyst", nameAuto: true } });
    expect(loadState(memoryStorage({ [STORAGE_KEY]: saved }), TODAY).profile.name).toBe("Zoe Lopez");
  });

  it("falls back to the blank state on corrupted JSON", () => {
    expect(loadState(memoryStorage({ [STORAGE_KEY]: "{not json" }), TODAY)).toEqual(blank());
  });

  it("falls back to the blank state when reading throws", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };
    expect(loadState(storage, TODAY)).toEqual(blank());
  });
});

describe("saveState", () => {
  it("writes the whole state as JSON under the legacy key", () => {
    const storage = memoryStorage();
    const state = { ...blank(), goal: 7, goalSet: true };
    expect(saveState(storage, state)).toBe(true);
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual(state);
  });

  it("never throws when the storage is full or blocked", () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };
    expect(saveState(storage, blank())).toBe(false);
    expect(saveState(null, blank())).toBe(false);
  });

  it("round-trips through loadState", () => {
    const storage = memoryStorage();
    const state = hydrate({ ...blank(), ...sample }, TODAY);
    saveState(storage, state);
    const loaded = loadState(storage, TODAY);
    expect(loaded).toEqual({ ...state, profile: syncProfileName(state.profile) });
  });
});
