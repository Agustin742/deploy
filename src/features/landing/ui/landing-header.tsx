import Link from "next/link";
import { contactLink } from "@/features/offer/domain/contact";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import { buttonClass } from "@/shared/ui/styles";

const ANCHORS = [
  ["Producto", "#producto"],
  ["Precios", "#precios"],
  ["Preguntas", "#preguntas"],
] as const;

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-2 px-4 md:gap-6">
        <a href="#" className="flex shrink-0 items-center gap-2.5 rounded-control" aria-label="Deploy your Career, inicio">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-control bg-accent font-display text-section font-extrabold text-accent-ink"
          >
            D
          </span>
          <b className="font-display text-section font-extrabold tracking-tight max-sm:sr-only">Deploy your Career</b>
        </a>

        <nav aria-label="Secciones" className="hidden flex-1 items-center gap-1 md:flex">
          {ANCHORS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-10 items-center rounded-control px-3 font-medium text-muted hover:bg-soft hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link href="/app" className={`${buttonClass("ghost", "md")} px-3`}>
            Ingresar
          </Link>
          <a {...contactLink()} className={`${buttonClass("primary", "md")} px-3 sm:px-4`}>
            Comprar acceso
          </a>
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </header>
  );
}
