import Link from "next/link";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import { Menu, MenuItem, MenuSeparator, menuItemClass } from "@/shared/ui/menu";
import { buttonClass } from "@/shared/ui/styles";
import type { TabId } from "../domain/tabs";

export interface HeaderTab {
  id: TabId;
  label: string;
}

export interface HeaderNav {
  primary: HeaderTab[];
  /** Tabs behind the "Más" menu. */
  more: HeaderTab[];
}

export interface AppHeaderProps {
  /** Name and headline of the person; empty while the data is still loading. */
  who: string;
  initials: string;
  /** Null while the saved data is loading: the navigation depends on it. */
  nav: HeaderNav | null;
  active: TabId;
  onSelect: (tab: TabId) => void;
  /** Opens the new-application view (the global main action). */
  onNewApplication: () => void;
  /** Wide layouts get the navigation bar in the header; narrow ones use the bottom bar. */
  wide: boolean;
  /** Shows the link to the access admin page (owners only). */
  isOwner?: boolean;
}

const navButton =
  "relative inline-flex min-h-10 cursor-pointer items-center gap-1 whitespace-nowrap rounded-control px-2.5 text-body transition-colors lg:px-3.5";

export function AppHeader({ who, initials, nav, active, onSelect, onNewApplication, wide, isOwner = false }: AppHeaderProps) {
  const moreActive = nav?.more.some((t) => t.id === active) ?? false;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 lg:gap-6">
        <button
          type="button"
          onClick={() => onSelect("resumen")}
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-control"
          aria-label="Deploy your Career, ir al resumen"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-control bg-accent font-display text-section font-extrabold text-accent-ink"
          >
            D
          </span>
          <b className="font-display text-section font-extrabold tracking-tight md:max-lg:sr-only">Deploy your Career</b>
        </button>

        {wide && nav ? (
          <nav aria-label="Secciones" className="flex min-w-0 flex-1 items-center gap-0.5">
            {nav.primary.map((t) => (
              <NavButton key={t.id} active={t.id === active} onClick={() => onSelect(t.id)}>
                {t.label}
              </NavButton>
            ))}
            {nav.more.length ? (
              <Menu
                triggerLabel="Más secciones"
                align="start"
                triggerClassName={`${navButton} ${
                  moreActive ? "bg-soft font-semibold text-ink" : "font-medium text-muted hover:bg-soft hover:text-ink"
                }`}
                trigger={
                  <>
                    Más
                    <Chevron />
                  </>
                }
              >
                {nav.more.map((t) => (
                  <MenuItem key={t.id} current={t.id === active} onSelect={() => onSelect(t.id)}>
                    {t.label}
                  </MenuItem>
                ))}
              </Menu>
            ) : null}
          </nav>
        ) : (
          <div className="flex-1" aria-hidden={wide ? true : undefined}>
            {wide && !nav ? <NavSkeleton /> : null}
          </div>
        )}

        {wide && nav ? (
          <button type="button" className={buttonClass("cta", "md")} onClick={onNewApplication}>
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            <span className="max-lg:sr-only">Cargar postulación</span>
          </button>
        ) : null}

        <Menu
          triggerLabel="Cuenta"
          triggerClassName="flex min-h-10 cursor-pointer items-center gap-2 rounded-control border border-line-strong bg-surface py-1 pl-1 pr-2.5 hover:bg-soft"
          trigger={
            <>
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-soft font-display text-small font-bold"
              >
                {initials || "•"}
              </span>
              <Chevron />
            </>
          }
          panelClassName="w-72"
        >
          <div className="px-3 pb-1 pt-2" role="presentation">
            <div className="text-caption font-semibold uppercase tracking-wide text-muted">Cuenta</div>
            <div className="mt-0.5 break-words text-body font-semibold">{who || "Cargando…"}</div>
          </div>
          <MenuSeparator />
          <ThemeToggle variant="menuitem" />
          {isOwner ? (
            <Link href="/app/admin" role="menuitem" tabIndex={-1} className={menuItemClass}>
              Accesos
            </Link>
          ) : null}
          <MenuSeparator />
          <SignOutButton variant="menuitem" />
        </Menu>
      </div>
    </header>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`${navButton} ${
        active
          ? "bg-soft font-semibold text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-accent"
          : "font-medium text-muted hover:bg-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

function NavSkeleton() {
  return (
    <div className="flex gap-2" aria-hidden="true">
      {[72, 104, 76, 48].map((w) => (
        <span key={w} className="h-6 animate-pulse rounded-control bg-soft motion-reduce:animate-none" style={{ width: w }} />
      ))}
    </div>
  );
}
