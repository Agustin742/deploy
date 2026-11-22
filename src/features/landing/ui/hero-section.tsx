import Link from "next/link";
import { buttonClass } from "@/shared/ui/styles";

export function HeroSection() {
  return (
    <section className="py-section-sm md:py-section">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="font-display text-hero font-extrabold md:text-display">
            Cargá tus postulaciones rápido y mirá cómo avanza tu búsqueda
          </h1>
          <p className="mt-5 max-w-lg text-[1.125rem] text-muted">
            Seguimiento de postulaciones, plan semanal y tablero para profesionales IT de Latinoamérica.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#acceso" className={buttonClass("cta", "lg")}>
              Cómo conseguir acceso
            </a>
            <Link
              href="/app"
              className="inline-flex min-h-10 items-center font-semibold text-accent underline-offset-4 hover:underline"
            >
              Ya tengo cuenta → Ingresar
            </Link>
          </div>
          <p className="mt-5 text-small text-muted">Acceso por invitación · Tus datos en tu cuenta</p>
        </div>

        <HeroImage />
      </div>
    </section>
  );
}

/**
 * Fixed 4:3 slot for the hero image. Until there is one, a quiet mock of the dashboard fills it.
 * TODO(owner): replace with hero image (next/image, same aspect ratio, with `priority`).
 */
function HeroImage() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-hero border border-line bg-surface p-5 shadow-raised sm:p-7"
    >
      <div className="grid h-full grid-rows-[auto_1fr] gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["18", "bg-accent"],
            ["6", "bg-lime"],
            ["42%", "bg-soft"],
          ].map(([value, tone]) => (
            <div key={value} className="rounded-card border border-line p-3">
              <div className="font-display text-title font-extrabold tabular-nums">{value}</div>
              <div className={`mt-2 h-1.5 w-2/3 rounded-full ${tone}`} />
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-card border border-line p-4">
          {[30, 45, 35, 60, 50, 75, 90].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t ${i === 6 ? "bg-accent" : "bg-accent/40"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
