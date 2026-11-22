import type { ReactNode } from "react";
import { Menu, MenuItem } from "@/shared/ui/menu";
import type { TabId } from "../domain/tabs";
import type { HeaderTab } from "./app-header";

export interface MobileNavProps {
  /** Tabs with their own slot in the bar. */
  items: HeaderTab[];
  /** Everything else, listed in the "Más" sheet. */
  more: HeaderTab[];
  active: TabId;
  onSelect: (tab: TabId) => void;
  onNewApplication: () => void;
}

const cell =
  "flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-1 text-caption transition-colors";

const ICONS: Partial<Record<TabId, ReactNode>> = {
  resumen: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  postulaciones: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  analisis: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Fixed bottom bar for narrow screens: three destinations, "Más" and a central "load application" action. */
export function MobileNav({ items, more, active, onSelect, onNewApplication }: MobileNavProps) {
  const moreActive = more.some((t) => t.id === active);
  const tone = (on: boolean) => (on ? "font-semibold text-accent" : "font-medium text-muted");
  const [first, second, third] = items;

  const slot = (t: HeaderTab | undefined) =>
    t ? (
      <li key={t.id}>
        <button
          type="button"
          aria-current={t.id === active ? "page" : undefined}
          onClick={() => onSelect(t.id)}
          className={`${cell} ${tone(t.id === active)}`}
        >
          <Icon>{ICONS[t.id]}</Icon>
          {t.label}
        </button>
      </li>
    ) : null;

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] shadow-raised"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end">
        {slot(first)}
        {slot(second)}
        <li className="flex justify-center">
          <button
            type="button"
            onClick={onNewApplication}
            aria-label="Cargar postulación"
            className="btn btn-cta -mt-5 mb-1.5 size-14 rounded-full p-0 text-[1.75rem] leading-none"
          >
            +
          </button>
        </li>
        {slot(third)}
        <li>
          <Menu
            triggerLabel="Más secciones"
            side="top"
            triggerClassName={`${cell} ${tone(moreActive)}`}
            panelClassName="w-64"
            trigger={
              <>
                <Icon>
                  <path d="M5 12h.01M12 12h.01M19 12h.01" />
                </Icon>
                Más
              </>
            }
          >
            {more.map((t) => (
              <MenuItem key={t.id} current={t.id === active} onSelect={() => onSelect(t.id)}>
                {t.label}
              </MenuItem>
            ))}
          </Menu>
        </li>
      </ul>
    </nav>
  );
}
