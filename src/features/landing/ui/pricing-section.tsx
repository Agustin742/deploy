"use client";

import { useState, useSyncExternalStore } from "react";
import { countryFromLocale } from "@/features/offer/domain/country-locale";
import { OFERTA, resolveCountry, SHOW_DRAFT_NOTICE } from "@/features/offer/domain/offer";
import { CountryPicker } from "./country-picker";
import { PlanCard } from "./plan-card";
import { ServicesList } from "./services-list";

const STEPS = ["Elegís tu país", "Pagás", "Recibís tu invitación"] as const;

const subscribeNever = () => () => {};

/** Container: owns the selected country; cards are presentational. */
export function PricingSection() {
  const [chosen, setChosen] = useState<string | null>(null);
  // Best-effort guess from the browser language. The server snapshot is null, so SSR and hydration
  // render the default country and the guess only applies on the client afterwards.
  const detected = useSyncExternalStore(
    subscribeNever,
    () => countryFromLocale(navigator.language, OFERTA.paises),
    () => null,
  );
  const country = resolveCountry(chosen ?? detected);
  const [tool, ...services] = OFERTA.productos;

  return (
    <section id="precios" className="bg-soft py-section-sm md:py-section">
      <div className="mx-auto max-w-[1180px] px-4">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-hero font-extrabold">Precios</h2>
          <p className="mt-3 text-muted">
            Un pago único por un año de acceso a la herramienta. Los servicios se contratan aparte.
          </p>
        </div>

        {SHOW_DRAFT_NOTICE ? (
          <div className="mx-auto mt-6 max-w-xl rounded-card border border-warn/30 bg-warn/10 px-3 py-2.5 text-small">
            <b>Borrador.</b> Faltan confirmar los precios y los textos legales.
          </div>
        ) : null}

        <div className="mx-auto mt-8 flex max-w-xl justify-center">
          <CountryPicker
            countries={OFERTA.paises}
            value={country}
            onChange={setChosen}
          />
        </div>

        <div className="mt-6">
          <PlanCard product={tool} country={country} />
        </div>

        <ol className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-small text-muted">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="font-medium text-ink">{step}</span>
              {i < STEPS.length - 1 ? <span aria-hidden="true">→</span> : null}
            </li>
          ))}
        </ol>

        <ServicesList services={services} country={country} />
      </div>
    </section>
  );
}
