"use client";

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export interface DailySearchUiState {
  /** Month shown (YYYY-MM); null means the current month. In memory, like the original. */
  month: string | null;
  /** Platform being edited in place. */
  editId: string | null;
  /** Platform waiting for removal confirmation. */
  deleteId: string | null;
  setMonth: (month: string) => void;
  edit: (id: string) => void;
  askDelete: (id: string) => void;
  /** Cancels any edit or removal in progress. */
  clearRow: () => void;
}

export const dailySearchUi = createStore<DailySearchUiState>()((set) => ({
  month: null,
  editId: null,
  deleteId: null,
  setMonth: (month) => set({ month }),
  edit: (id) => set({ editId: id, deleteId: null }),
  askDelete: (id) => set({ deleteId: id, editId: null }),
  clearRow: () => set({ editId: null, deleteId: null }),
}));

export function useDailySearchUi<T>(selector: (s: DailySearchUiState) => T): T {
  return useStore(dailySearchUi, selector);
}
