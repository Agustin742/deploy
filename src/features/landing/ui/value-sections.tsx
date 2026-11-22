import type { ReactNode } from "react";

const VALUES = [
  ["Carga rápida", "Pegá la oferta y guardá la postulación en pocos pasos. La fuente se detecta sola."],
  ["Tablero claro", "Mirá tus estados, las respuestas y las postulaciones por mes en un solo vistazo."],
  ["Cuenta propia", "Tus datos se guardan en tu cuenta, no en un archivo suelto."],
] as const;

export function ValueStrip() {
  return (
    <section className="border-y border-line bg-surface py-section-sm">
      <ul className="mx-auto grid max-w-[1180px] gap-8 px-4 md:grid-cols-3">
        {VALUES.map(([title, text]) => (
          <li key={title}>
            <h2 className="font-display text-section font-bold">{title}</h2>
            <p className="mt-1.5 text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductRow({ title, children, flip = false }: { title: string; children: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? "lg:order-2" : ""}>
        <h3 className="font-display text-title font-extrabold">{title}</h3>
        <p className="mt-3 max-w-md text-muted">{children}</p>
      </div>
      {/* TODO(owner): replace with a screenshot of the real screen (next/image, 16:10). */}
      <div aria-hidden="true" className="aspect-[16/10] w-full rounded-hero border border-line bg-surface shadow-card" />
    </div>
  );
}

export function ProductSection() {
  return (
    <section id="producto" className="py-section-sm md:py-section">
      <div className="mx-auto grid max-w-[1180px] gap-16 px-4 md:gap-24">
        <ProductRow title="Cargá cada postulación sin vueltas">
          Pegá el link y el texto de la oferta. El match con tu CV se calcula mientras pegás y la postulación queda
          guardada con su estado.
        </ProductRow>
        <ProductRow title="Mirá cómo avanza tu búsqueda" flip>
          El Resumen te muestra cuántas postulaciones enviaste este mes, cuántas siguen en curso y tu tasa de
          respuesta, con la evolución mes a mes.
        </ProductRow>
      </div>
    </section>
  );
}
