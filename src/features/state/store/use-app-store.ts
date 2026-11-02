"use client";

import { useStore } from "zustand";
import { createAppStore, type AppStoreState } from "./app-store";

/** Single client-side store. Storage is resolved lazily, so importing this on the server is safe. */
export const appStore = createAppStore();

export function useAppStore<T>(selector: (s: AppStoreState) => T): T {
  return useStore(appStore, selector);
}
