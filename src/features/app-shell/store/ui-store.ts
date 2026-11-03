"use client";

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { DEFAULT_TAB, type TabId } from "../domain/tabs";

export const TOAST_MS = 2600;

export interface ShellUiState {
  /** Active tab. Not persisted: like the original, a reload starts on Resumen. */
  tab: TabId;
  /** Monday of the week shown in Plan, or null for the current week. */
  planWeek: string | null;
  toast: string | null;
  setTab: (tab: TabId) => void;
  setPlanWeek: (week: string | null) => void;
  showToast: (message: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** Transient view state of the app shell (what is open, not what the person saved). */
export const shellUi = createStore<ShellUiState>()((set) => ({
  tab: DEFAULT_TAB,
  planWeek: null,
  toast: null,
  setTab: (tab) => set({ tab }),
  setPlanWeek: (planWeek) => set({ planWeek }),
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS);
  },
}));

export function useShellUi<T>(selector: (s: ShellUiState) => T): T {
  return useStore(shellUi, selector);
}
