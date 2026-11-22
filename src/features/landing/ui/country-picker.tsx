"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { normalizeForSearch } from "@/features/offer/domain/country-locale";

export interface CountryPickerProps {
  countries: readonly string[];
  value: string;
  onChange: (country: string) => void;
}

/**
 * "Mostrando precios para <país> · Cambiar": a searchable combobox in a popover,
 * instead of the native select. Arrow keys move the highlight, Enter picks, Escape closes.
 */
export function CountryPicker({ countries, value, onChange }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const options = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    return q ? countries.filter((c) => normalizeForSearch(c).includes(q)) : [...countries];
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, countries.indexOf(value)));
    setOpen(true);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const pick = (country: string) => {
    onChange(country);
    close(true);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = options[active];
      if (chosen) pick(chosen);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;
  const activeIndex = Math.min(active, options.length - 1);

  return (
    <div ref={rootRef} className="relative">
      <p className="text-small text-muted">
        Mostrando precios para <b className="font-semibold text-ink">{value}</b>
        {" · "}
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openList())}
          className="cursor-pointer rounded-control font-semibold text-accent underline underline-offset-4"
        >
          Cambiar
        </button>
      </p>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-card border border-line-strong bg-surface p-2 shadow-raised">
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={options.length ? optionId(activeIndex) : undefined}
            aria-label="Buscar país"
            placeholder="Buscar país"
            autoComplete="off"
            className="field-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <ul id={listId} role="listbox" aria-label="Países" className="mt-2 max-h-60 overflow-y-auto">
            {options.map((c, i) => (
              <li
                key={c}
                id={optionId(i)}
                role="option"
                aria-selected={c === value}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                onMouseMove={() => setActive(i)}
                className={`flex min-h-10 cursor-pointer items-center justify-between rounded-control px-3 text-body ${
                  i === activeIndex ? "bg-soft" : ""
                } ${c === value ? "font-semibold" : ""}`}
              >
                {c}
                {c === value ? <span aria-hidden="true">✓</span> : null}
              </li>
            ))}
            {options.length ? null : <li className="px-3 py-2 text-small text-muted">Sin resultados</li>}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
