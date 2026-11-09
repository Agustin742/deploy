"use client";

import { useStore } from "zustand";
import { SIGN_IN_PATH } from "@/features/auth/domain/route-guard";
import { shellUi } from "@/features/app-shell/store/ui-store";
import { applyCommands, loadMyState } from "@/features/sync/infrastructure/actions";
import { createAppStore, type AppStoreState } from "./app-store";

/** Single client-side store, synced with the signed-in user's rows through the Server Functions. */
export const appStore = createAppStore({
  ports: { loadState: loadMyState, applyCommands },
  onNotice: (message) => shellUi.getState().showToast(message),
  onUnauthorized: () => window.location.assign(SIGN_IN_PATH),
});

export function useAppStore<T>(selector: (s: AppStoreState) => T): T {
  return useStore(appStore, selector);
}
