"use client";

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { SortKey } from "../domain/list";

export interface ApplicationsUiState {
  filter: string;
  q: string;
  sort: SortKey;
  /** Application shown in the detail drawer. */
  openId: string | null;
  confirmDel: boolean;
  /** The "before sharing with an AI" notice is showing for this application. */
  aiAskId: string | null;
  setFilter: (filter: string) => void;
  setQ: (q: string) => void;
  setSort: (sort: SortKey) => void;
  open: (id: string) => void;
  close: () => void;
  setConfirmDel: (value: boolean) => void;
  setAiAsk: (id: string | null) => void;
}

/** Transient view state of the Postulaciones tab (in memory, like the original). */
export const applicationsUi = createStore<ApplicationsUiState>()((set) => ({
  filter: "Todos",
  q: "",
  sort: "fecha",
  openId: null,
  confirmDel: false,
  aiAskId: null,
  setFilter: (filter) => set({ filter }),
  setQ: (q) => set({ q }),
  setSort: (sort) => set({ sort }),
  open: (id) => set({ openId: id, confirmDel: false, aiAskId: null }),
  close: () => set({ openId: null, confirmDel: false, aiAskId: null }),
  setConfirmDel: (confirmDel) => set({ confirmDel }),
  setAiAsk: (aiAskId) => set({ aiAskId }),
}));

export function useApplicationsUi<T>(selector: (s: ApplicationsUiState) => T): T {
  return useStore(applicationsUi, selector);
}
