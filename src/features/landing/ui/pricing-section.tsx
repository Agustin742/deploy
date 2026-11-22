import { OFERTA } from "@/features/offer/domain/offer";
import { PlanCard } from "./plan-card";
import { ServicesList } from "./services-list";

const STEPS = ["Nos escribís por WhatsApp", "Habilitamos tu email", "Entrás con Google o con un link por email"] as const;

/** Access section: the dominant tool plan, how access works and the optional services. */
export function PricingSection() {
  const [tool, ...services] = OFERTA.productos;

  return (
    <section id="acceso" className="bg-soft py-section-sm md:py-section">
      <div className="mx-auto max-w-[1180px] px-4">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-hero font-extrabold">Conseguí tu acceso</h2>
          <p className="mt-3 text-muted">
            Escribinos por WhatsApp y te damos acceso a la herramienta. Los servicios se consultan aparte.
          </p>
        </div>

        <div className="mt-8">
          <PlanCard product={tool} />
        </div>

        <ol className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-small text-muted">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="font-medium text-ink">{step}</span>
              {i < STEPS.length - 1 ? <span aria-hidden="true">→</span> : null}
            </li>
          ))}
        </ol>

        <ServicesList services={services} />
      </div>
    </section>
  );
}
