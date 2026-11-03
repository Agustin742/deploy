export type Theme = "light" | "dark";

/** Same key as the legacy artifact so saved preferences carry over. */
export const THEME_KEY = "radar-theme";

interface ReadableStorage {
  getItem(key: string): string | null;
}
interface WritableStorage {
  setItem(key: string, value: string): void;
}

export const parseTheme = (raw: string | null | undefined): Theme | null =>
  raw === "light" || raw === "dark" ? raw : null;

export const resolveTheme = (stored: Theme | null, systemDark: boolean): Theme =>
  stored ?? (systemDark ? "dark" : "light");

export const nextTheme = (current: Theme): Theme => (current === "dark" ? "light" : "dark");

/** Label shows the action; `null` is the pre-hydration placeholder. */
export const themeToggleLabel = (current: Theme | null): string => {
  if (current === null) return "◐ Tema";
  return current === "dark" ? "☀ Modo claro" : "☾ Modo oscuro";
};

export const readStoredTheme = (storage: ReadableStorage): Theme | null => {
  try {
    return parseTheme(storage.getItem(THEME_KEY));
  } catch {
    return null;
  }
};

export const writeStoredTheme = (storage: WritableStorage, theme: Theme): void => {
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable: the choice only lasts for this page view.
  }
};

/** Runs before first paint so the stored theme never flashes (legacy parity). */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
