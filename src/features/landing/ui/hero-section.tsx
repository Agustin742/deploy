import Image from "next/image";
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
            <a href="#acceso" className={`${buttonClass("cta", "lg")} btn-lift`}>
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

/** Transparent artwork: it sits directly on the page background in light and dark themes. */
function HeroImage() {
  return (
    <div className="hero-float mx-auto w-full max-w-[480px] lg:mx-0 lg:ml-auto lg:max-w-none lg:w-[112%] lg:-mr-[6%]">
      <Image
        src="/hero-banner.webp"
        width={1398}
        height={856}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        alt="Sapito de Deploy your Career ayudando a una persona a postularse desde su notebook"
        className="h-auto w-full"
      />
    </div>
  );
}
