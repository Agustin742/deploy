import { OFERTA } from "@/features/offer/domain/offer";

const panel = "rounded-xl border border-line bg-surface p-[18px]";

const FAQ = [
  ["¿Cuánto dura el acceso a la herramienta?", "Un año desde la fecha de pago."],
  [
    "¿Garantizan que voy a conseguir trabajo?",
    "No. La herramienta y los servicios te ayudan a organizarte y mejorar tus materiales, pero no garantizan empleo ni resultados.",
  ],
  ["¿Para quién es?", "Profesionales IT de Latinoamérica: trainee, junior, semi senior y senior."],
] as const;

export function LandingInfo() {
  return (
    <>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        <div className={panel}>
          <h3 className="text-base font-bold">Cómo funciona</h3>
          <ol className="mt-2 list-decimal pl-5">
            <li>Elegís el producto o servicio y tu país.</li>
            <li>Pagás con los medios de pago de tu país.</li>
            <li>Recibís tu acceso o coordinamos el servicio.</li>
          </ol>
        </div>
        <div className={panel}>
          <h3 className="text-base font-bold">Preguntas frecuentes</h3>
          {FAQ.map(([q, a]) => (
            <p key={q} className="mb-0.5 mt-2">
              <b>{q}</b>
              <br />
              <span className="text-muted">{a}</span>
            </p>
          ))}
        </div>
      </div>
      <div className={`${panel} mt-4`}>
        <h3 className="text-base font-bold">Contacto y documentos</h3>
        <p className="mt-1.5 text-muted">
          Para consultas, escribinos por la página de servicios de LinkedIn de Deploy your Career.
        </p>
        {OFERTA.borrador && (
          <p className="mt-2 text-xs text-muted">
            En preparación: términos y condiciones, política de privacidad y política de reembolsos.
          </p>
        )}
      </div>
    </>
  );
}
