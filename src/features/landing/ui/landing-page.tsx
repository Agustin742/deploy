import Link from "next/link";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import { LandingInfo } from "./landing-info";
import { PricingSection } from "./pricing-section";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-3 pt-[18px]">
        <div className="mr-auto flex flex-col leading-[1.15]">
          <b className="font-display text-[21px] font-extrabold tracking-tight">Deploy your Career</b>
        </div>
        <Link
          href="/app"
          className="rounded-lg border border-accent bg-accent px-3.5 py-2 font-semibold text-accent-ink hover:brightness-110"
        >
          Ingresar
        </Link>
        <ThemeToggle />
      </header>
      <main>
        <section className="mb-5 mt-2 rounded-xl border border-line bg-surface p-7">
          <h1 className="mb-2.5 text-[clamp(28px,5vw,44px)] font-extrabold">
            Organizá tu búsqueda laboral IT y avanzá con un plan claro
          </h1>
          <p className="mb-4 max-w-[640px] text-[17px] text-muted">
            Una herramienta de seguimiento, plan semanal y mensual, y servicios de empleabilidad para
            profesionales IT de Latinoamérica.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app"
              className="rounded-lg border border-accent bg-accent px-3.5 py-2 font-semibold text-accent-ink hover:brightness-110"
            >
              Ingresar a la herramienta
            </Link>
            <a
              href="#planes-lista"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 font-medium text-accent hover:border-muted"
            >
              Ver planes y precios
            </a>
          </div>
        </section>
        <PricingSection />
        <LandingInfo />
      </main>
      <footer className="mt-8 max-w-[760px] border-t border-line pt-3.5 text-xs text-muted">
        Este radar organiza tu búsqueda y no garantiza empleo ni resultados. La IA sugiere; la
        decisión final es tuya. Tus datos se guardan solo en este navegador.
      </footer>
    </div>
  );
}
