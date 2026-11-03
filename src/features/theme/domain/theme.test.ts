import { describe, expect, it } from "vitest";
import {
  THEME_KEY,
  nextTheme,
  parseTheme,
  readStoredTheme,
  resolveTheme,
  themeToggleLabel,
  writeStoredTheme,
} from "./theme";

const fakeStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    data,
  };
};

describe("theme domain", () => {
  it("uses the legacy storage key", () => {
    expect(THEME_KEY).toBe("radar-theme");
  });

  it("parses only light and dark", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("blue")).toBeNull();
    expect(parseTheme(null)).toBeNull();
    expect(parseTheme("")).toBeNull();
  });

  it("resolves explicit choice over system preference, else follows system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("toggles to the opposite theme", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });

  it("labels the button with the action it performs", () => {
    expect(themeToggleLabel("dark")).toBe("☀ Modo claro");
    expect(themeToggleLabel("light")).toBe("☾ Modo oscuro");
    expect(themeToggleLabel(null)).toBe("◐ Tema");
  });

  it("reads and writes the stored theme", () => {
    const s = fakeStorage({ [THEME_KEY]: "dark" });
    expect(readStoredTheme(s)).toBe("dark");
    writeStoredTheme(s, "light");
    expect(s.data[THEME_KEY]).toBe("light");
  });

  it("tolerates storage failures", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    expect(readStoredTheme(broken)).toBeNull();
    expect(() => writeStoredTheme(broken, "dark")).not.toThrow();
  });
});
