"use client";

import type { ReactNode } from "react";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { addItem, removeItem, setItemField } from "../domain/items";
import {
  createRegistryItem,
  REGISTRIES,
  sortRegistry,
  type CreateOptions,
  type RegistryItems,
  type RegistryKey,
} from "../domain/registries";
import { RegistryList } from "./registry-list";

/** Adds a new, empty item to a registry and saves right away. */
export function addRegistryItem<K extends RegistryKey>(key: K, today: string, options?: CreateOptions) {
  appStore
    .getState()
    .update((s) => addItem(s, key, createRegistryItem(key, today, options)), { immediate: true });
}

export interface RegistryContainerProps<K extends RegistryKey> {
  registry: K;
  today: string;
  /** Narrows the list, e.g. weekly vs monthly objectives. */
  filter?: (item: RegistryItems[K]) => boolean;
  empty?: readonly [string, string];
  renderExtra?: (item: RegistryItems[K]) => ReactNode;
}

/** Connects a registry list to the app store: reads the items and writes edits and deletions. */
export function RegistryContainer<K extends RegistryKey>({
  registry,
  today,
  filter,
  empty,
  renderExtra,
}: RegistryContainerProps<K>) {
  const state = useAppStore((s) => s.state);
  const def = REGISTRIES[registry];
  const all = state[registry] as unknown as RegistryItems[K][];
  const items = sortRegistry(registry, filter ? all.filter(filter) : all);

  return (
    <RegistryList
      def={def}
      items={items}
      ctx={{ state, today }}
      mods={state.mods}
      empty={empty}
      renderExtra={renderExtra}
      onField={(id, field, value, immediate) =>
        appStore
          .getState()
          .update((s) => setItemField(s, registry, id, field, value, today), { immediate })
      }
      onDelete={(id) => appStore.getState().update((s) => removeItem(s, registry, id), { immediate: true })}
    />
  );
}
