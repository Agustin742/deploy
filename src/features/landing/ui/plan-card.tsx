import { contactLink } from "@/features/offer/domain/contact";
import type { Product } from "@/features/offer/domain/offer";
import { buttonClass } from "@/shared/ui/styles";

/** The dominant plan: the tool with 1 year of access. Access is requested over WhatsApp. */
export function PlanCard({ product }: { product: Product }) {
  const link = contactLink();

  return (
    <article className="card card-hero relative mx-auto w-full max-w-xl p-6 sm:p-8">
      <span className="inline-block rounded-full bg-accent px-3 py-1 text-caption font-semibold text-accent-ink">
        Acceso por 1 año
      </span>
      <h3 className="mt-4 font-display text-title font-extrabold">{product.n}</h3>
      <p className="mt-1 text-muted">{product.d}</p>

      <ul className="mt-6 grid gap-3">
        {product.inc.map((item) => (
          <li key={item} className="flex gap-3">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="mt-0.5 size-5 shrink-0 text-ok"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 10.5 4 4 8-9" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <a
        {...link}
        className={`${buttonClass("cta", "lg")} mt-8 w-full`}
      >
        Pedir acceso por WhatsApp
      </a>
    </article>
  );
}
