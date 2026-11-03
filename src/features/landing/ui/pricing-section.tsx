"use client";

import { useState } from "react";
import { OFERTA, resolveCountry } from "@/features/offer/domain/offer";
import { ProductCard } from "./product-card";

/** Container: owns the selected country; cards are presentational. */
export function PricingSection() {
  const [selected, setSelected] = useState("Argentina");
  const country = resolveCountry(selected);

  return (
    <section>
      <div className="mb-4 mt-3.5 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="text-2xl font-extrabold">Planes y servicios</h2>
          <p className="mt-0.5 text-muted">
            Deploy your Career: empleabilidad y desarrollo profesional para profesionales IT de
            Latinoamérica, desde trainee hasta senior.
          </p>
        </div>
        <label className="flex min-w-[210px] flex-col gap-1 text-xs font-medium text-muted">
          Precios para
          <select
            className="w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-base text-ink focus:border-accent"
            value={country}
            onChange={(e) => setSelected(e.target.value)}
          >
            {OFERTA.paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      {OFERTA.borrador && (
        <div className="mb-3.5 rounded-[10px] border border-warn/30 bg-warn/10 px-3 py-2.5 text-[13px]">
          <b>Borrador.</b> Faltan confirmar los precios y los textos legales.
        </div>
      )}
      <div
        id="planes-lista"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4"
      >
        {OFERTA.productos.map((product) => (
          <ProductCard key={product.n} product={product} country={country} />
        ))}
      </div>
    </section>
  );
}
