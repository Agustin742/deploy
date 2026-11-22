import { contactLink } from "@/features/offer/domain/contact";
import { offerPrice, type Product } from "@/features/offer/domain/offer";

function ConsultLink({ label }: { label: string }) {
  const link = contactLink();
  return (
    <a
      href={link.href}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      className="inline-flex min-h-10 shrink-0 items-center rounded-control px-2 text-small font-semibold text-accent underline-offset-4 hover:underline"
    >
      Consultar
    </a>
  );
}

/** The free diagnostic as a banner row and the paid services as a compact list with secondary prices. */
export function ServicesList({ services, country }: { services: Product[]; country: string }) {
  const free = services.filter((p) => p.gratis);
  const paid = services.filter((p) => !p.gratis);

  return (
    <div className="mx-auto mt-14 max-w-3xl">
      {free.map((p) => (
        <div
          key={p.n}
          className="card card-quiet mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4"
        >
          <div className="min-w-0">
            <b className="font-display text-section">{p.n}</b>
            <span className="ml-2 rounded-full border border-ok/40 px-2 py-px text-caption font-semibold text-ok">
              Gratis
            </span>
            <p className="mt-0.5 text-small text-muted">{p.d}</p>
          </div>
          <ConsultLink label={`Consultar: ${p.n}`} />
        </div>
      ))}

      <h3 className="font-display text-section font-bold">Servicios adicionales</h3>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {paid.map((p) => {
          const price = offerPrice(p, country);
          return (
            <li key={p.n} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0 flex-1 basis-60">
                <b className="font-semibold">{p.n}</b>
                <p className="text-small text-muted">{p.d}</p>
              </div>
              <span className="font-mono text-small text-muted">{price}</span>
              <ConsultLink label={`Consultar: ${p.n}`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
