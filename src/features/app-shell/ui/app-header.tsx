import Link from "next/link";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import { btn } from "@/shared/ui/styles";
import type { TabId } from "../domain/tabs";

export interface HeaderTab {
  id: TabId;
  label: string;
  /** Counter shown next to the label, if any. */
  count: number | null;
}

export interface AppHeaderProps {
  /** Subtitle under the brand; empty while the data is still loading. */
  who: string;
  /** Null while the saved data is loading: the tab bar depends on it. */
  tabs: HeaderTab[] | null;
  active: TabId;
  onSelect: (tab: TabId) => void;
}

export function AppHeader({ who, tabs, active, onSelect }: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-3 pt-[18px]">
      <div className="flex flex-col leading-[1.15]">
        <b className="font-display text-[21px] font-extrabold tracking-tight">Deploy your Career</b>
        <span className="text-xs text-muted">{who}</span>
      </div>
      {tabs ? (
        <nav aria-label="Secciones" className="flex max-w-full flex-1 gap-1 overflow-x-auto pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={t.id === active ? "page" : undefined}
              onClick={() => onSelect(t.id)}
              className={`cursor-pointer whitespace-nowrap rounded-lg border-0 px-3.5 py-2 ${
                t.id === active
                  ? "bg-lime font-semibold text-lime-ink"
                  : "bg-transparent font-medium text-muted hover:bg-soft hover:text-ink"
              }`}
            >
              {t.label}
              {t.count !== null ? (
                <span className="ml-1.5 font-mono text-[11px] opacity-70">{t.count}</span>
              ) : null}
            </button>
          ))}
        </nav>
      ) : (
        <div className="flex-1" />
      )}
      <Link href="/" className={btn}>
        Salir
      </Link>
      <ThemeToggle />
    </header>
  );
}
