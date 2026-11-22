const FAQ = [
  ["¿Cuánto dura el acceso a la herramienta?", "Un año desde que te habilitamos."],
  [
    "¿Garantizan que voy a conseguir trabajo?",
    "No. La herramienta y los servicios te ayudan a organizarte y mejorar tus materiales, pero no garantizan empleo ni resultados.",
  ],
  ["¿Para quién es?", "Profesionales IT de Latinoamérica: trainee, junior, semi senior y senior."],
  ["¿Cómo consigo acceso?", "Nos escribís por WhatsApp y, una vez que lo coordinamos, habilitamos tu email."],
  ["¿Qué pasa después de escribir?", "Habilitamos tu email y entrás con Google o con un link por email."],
  ["¿Dónde se guardan mis datos?", "Tus datos se guardan en tu cuenta."],
] as const;

/** Full-width accordion; native `<details>` keeps it keyboard and screen reader friendly. */
export function FaqSection() {
  return (
    <section id="preguntas" className="py-section-sm md:py-section">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center font-display text-hero font-extrabold">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-section font-semibold [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  aria-hidden="true"
                  className="font-mono text-section text-muted after:content-['+'] group-open:after:content-['–']"
                />
              </summary>
              <p className="pb-4 text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
