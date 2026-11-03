"use client";

import { useState, type ReactNode } from "react";
import type { Mods } from "@/features/state/domain/types";
import { EmptyState } from "@/shared/ui/primitives";
import { btn, btnDanger, btnGhost, btnSmall, fieldLabel, fieldsGrid, input, item as itemCard, row } from "@/shared/ui/styles";
import { selectOptions } from "../domain/items";
import {
  fieldOptions,
  isFieldVisible,
  type FieldDef,
  type RegistryContext,
  type RegistryDef,
} from "../domain/registries";

export interface RegistryListProps<T extends { id: string }> {
  def: RegistryDef<T>;
  items: readonly T[];
  ctx: RegistryContext;
  mods: Mods;
  /** Overrides the registry's own empty message. */
  empty?: readonly [string, string];
  /** `immediate` is true for discrete inputs (select, date, checkbox) that save right away. */
  onField: (id: string, field: string, value: string | boolean, immediate: boolean) => void;
  onDelete: (id: string) => void;
  renderExtra?: (item: T) => ReactNode;
}

const INPUT_TYPE = { d: "date", m: "month", n: "number", t: "text" } as const;

function Field<T extends { id: string }>({
  def,
  item,
  ctx,
  onField,
}: {
  def: FieldDef<T>;
  item: T;
  ctx: RegistryContext;
  onField: RegistryListProps<T>["onField"];
}) {
  const value = (item as Record<string, unknown>)[def.k];
  const text = value === undefined || value === null ? "" : String(value);

  if (def.t === "s") {
    return (
      <label className={fieldLabel}>
        {def.l}
        <select className={input} value={text} onChange={(e) => onField(item.id, def.k, e.target.value, true)}>
          {selectOptions(fieldOptions(def, item, ctx), text).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (def.t === "a") {
    return (
      <label className={`${fieldLabel} col-span-full`}>
        {def.l}
        <textarea
          className={`${input} resize-y leading-normal`}
          rows={2}
          placeholder={def.p ?? ""}
          value={text}
          onChange={(e) => onField(item.id, def.k, e.target.value, false)}
        />
      </label>
    );
  }
  if (def.t === "c") {
    return (
      <label className={`${fieldLabel} justify-end`}>
        <span className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onField(item.id, def.k, e.target.checked, true)}
          />{" "}
          {def.l}
        </span>
      </label>
    );
  }
  const immediate = def.t === "d" || def.t === "m";
  return (
    <label className={fieldLabel}>
      {def.l}
      <input
        className={input}
        type={INPUT_TYPE[def.t]}
        min={def.t === "n" ? 0 : undefined}
        placeholder={def.p ?? ""}
        value={text}
        onChange={(e) => onField(item.id, def.k, e.target.value, immediate)}
      />
    </label>
  );
}

/** Editable cards for one registry (network records, posts, employers...). Presentational. */
export function RegistryList<T extends { id: string }>({
  def,
  items,
  ctx,
  mods,
  empty,
  onField,
  onDelete,
  renderExtra,
}: RegistryListProps<T>) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!items.length) {
    const [title, hint] = empty ?? def.empty;
    return <EmptyState title={title}>{hint}</EmptyState>;
  }

  return (
    <>
      {items.map((it) => (
        <div key={it.id} className={itemCard}>
          <div className="mb-2.5 flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <b>{def.title(it)}</b>
              <div className="text-xs text-muted">{def.sub ? def.sub(it) : ""}</div>
            </div>
            {confirmId === it.id ? (
              <span className={row}>
                <button
                  type="button"
                  className={`${btnDanger} ${btnSmall}`}
                  onClick={() => {
                    setConfirmId(null);
                    onDelete(it.id);
                  }}
                >
                  Eliminar
                </button>
                <button type="button" className={`${btn} ${btnSmall}`} onClick={() => setConfirmId(null)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <button type="button" className={`${btnGhost} ${btnSmall}`} onClick={() => setConfirmId(it.id)}>
                Eliminar
              </button>
            )}
          </div>
          <div className={fieldsGrid}>
            {def.f
              .filter((f) => isFieldVisible(f, it, mods))
              .map((f) => (
                <Field key={f.k} def={f} item={it} ctx={ctx} onField={onField} />
              ))}
          </div>
          {renderExtra ? renderExtra(it) : null}
        </div>
      ))}
    </>
  );
}
