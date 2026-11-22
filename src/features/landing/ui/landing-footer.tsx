import { contactLink } from "@/features/offer/domain/contact";
import { SHOW_DRAFT_NOTICE } from "@/features/offer/domain/offer";
import { buttonClass } from "@/shared/ui/styles";
import { DISCLAIMER } from "@/shared/ui/site-footer";

export function FinalCta() {
  const link = contactLink();
  return (
    <section className="bg-ink py-section-sm text-bg md:py-section">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="font-display text-hero font-extrabold">Empezá a ordenar tu búsqueda</h2>
        <p className="mt-3 opacity-80">Un año de acceso, tus postulaciones y tu tablero en un solo lugar.</p>
        <a
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={`${buttonClass("cta", "lg")} mt-8`}
        >
          Comprar acceso
        </a>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer id="contacto" className="py-section-sm">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 md:grid-cols-2">
        <div>
          <b className="font-display text-section font-extrabold">Deploy your Career</b>
          <h2 className="mt-4 text-small font-semibold uppercase tracking-wide text-muted">Contacto</h2>
          <p className="mt-1 text-muted">
            Para consultas, escribinos por la página de servicios de LinkedIn de Deploy your Career.
          </p>
        </div>
        <div className="text-small text-muted">
          <p>{DISCLAIMER}</p>
          {SHOW_DRAFT_NOTICE ? (
            <p className="mt-2">
              En preparación: términos y condiciones, política de privacidad y política de reembolsos.
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
