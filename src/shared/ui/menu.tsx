"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const MenuContext = createContext<{ close: () => void }>({ close: () => {} });

/** Closes the surrounding menu; handy for items that act on click. */
export const useMenuClose = () => useContext(MenuContext).close;

export interface MenuProps {
  /** Visible content of the trigger button. */
  trigger: ReactNode;
  /** Accessible name of the trigger (and of the menu) when its content is not text. */
  triggerLabel?: string;
  triggerClassName?: string;
  /** Where the panel opens relative to the trigger. */
  side?: "bottom" | "top";
  align?: "start" | "end";
  panelClassName?: string;
  children: ReactNode;
}

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/**
 * Disclosure menu: a button that toggles a `role="menu"` panel.
 * Arrow keys move between items, Escape closes and returns focus to the trigger,
 * Tab or a click outside closes it.
 */
export function Menu({
  trigger,
  triggerLabel,
  triggerClassName = "",
  side = "bottom",
  align = "end",
  panelClassName = "",
  children,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);
  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
  }, [open]);

  const onPanelKeyDown = (event: KeyboardEvent) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      event.preventDefault();
      list[index]?.focus();
    };
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") focusAt((at + 1) % list.length);
    else if (event.key === "ArrowUp") focusAt((at - 1 + list.length) % list.length);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(list.length - 1);
    else if (event.key === "Tab") setOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Escape" && open) {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={onPanelKeyDown}
          className={`absolute z-50 min-w-56 max-w-[calc(100vw-2rem)] rounded-card border border-line-strong bg-surface p-1.5 shadow-raised ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "end" ? "right-0" : "left-0"} ${panelClassName}`.trim()}
        >
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

export const menuItemClass =
  "flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-left text-body font-medium text-ink hover:bg-soft focus-visible:bg-soft focus-visible:outline-2 focus-visible:-outline-offset-2";

/** Button item; closes the menu after `onSelect` unless `keepOpen`. */
export function MenuItem({
  onSelect,
  current = false,
  keepOpen = false,
  children,
}: {
  onSelect: () => void;
  current?: boolean;
  keepOpen?: boolean;
  children: ReactNode;
}) {
  const close = useMenuClose();
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-current={current ? "page" : undefined}
      className={`${menuItemClass} ${current ? "bg-soft font-semibold" : ""}`}
      onClick={() => {
        onSelect();
        if (!keepOpen) close();
      }}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" className="px-3 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}
