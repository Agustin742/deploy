import { plazoObj } from "@/features/plan/domain/objectives";
import type { AppState, Objetivo } from "@/features/state/domain/types";
import type { RegistryItems, RegistryKey } from "./registries";

type Row = { id: string } & Record<string, unknown>;

const rows = (state: AppState, key: RegistryKey): Row[] => state[key] as unknown as Row[];
const withRows = (state: AppState, key: RegistryKey, list: Row[]): AppState => ({ ...state, [key]: list });

/** New items go first, like the original lists. */
export const addItem = <K extends RegistryKey>(state: AppState, key: K, item: RegistryItems[K]): AppState =>
  withRows(state, key, [item as unknown as Row, ...rows(state, key)]);

export const removeItem = (state: AppState, key: RegistryKey, id: string): AppState =>
  withRows(
    state,
    key,
    rows(state, key).filter((x) => x.id !== id),
  );

const PERIOD_FIELDS = ["periodo", "semana", "mes"];

/**
 * Sets one field of an item. Objectives keep `doneAt` in step with their status and
 * recompute their deadline when the period changes. Unknown ids leave the state as is.
 */
export function setItemField(
  state: AppState,
  key: RegistryKey,
  id: string,
  field: string,
  value: string | boolean,
  today: string,
): AppState {
  const list = rows(state, key);
  if (!list.some((x) => x.id === id)) return state;
  return withRows(
    state,
    key,
    list.map((item) => {
      if (item.id !== id) return item;
      const next: Row = { ...item, [field]: value };
      if (key === "objetivos") {
        if (field === "estado") next.doneAt = value === "Hecho" ? today : "";
        if (PERIOD_FIELDS.includes(field)) next.plazo = plazoObj(next as unknown as Objetivo, today);
      }
      return next;
    }),
  );
}

/** Options of a select, keeping a saved value that is no longer one of them (listed first). */
export const selectOptions = (options: readonly string[], current: unknown): string[] => {
  const list = [...options];
  if (current && !list.includes(current as string)) list.unshift(current as string);
  return list;
};
