const FAQ = [
  [
    "¿Cómo consigo acceso?",
    "Nos escribís por WhatsApp y coordinamos con vos. Cuando quedamos de acuerdo, habilitamos tu email. Después entrás con Google o con un link que te llega por email.",
  ],
  [
    "¿Cómo entro a la herramienta?",
    "Entrás con tu cuenta de Google o con un link por email, sin contraseñas que recordar. Solo pueden entrar los emails que habilitamos, así que usá el mismo email que nos pasaste por WhatsApp.",
  ],
  [
    "¿Cuánto dura el acceso?",
    "El acceso dura un año desde que lo activamos. En ese tiempo podés cargar tus postulaciones, mirar tus tableros y usar el plan y la búsqueda diaria.",
  ],
  [
    "¿Qué puedo hacer con la herramienta?",
    "Cargás tus postulaciones, mirás tus tableros con estados y respuestas por mes, armás tu plan y llevás un registro de tu búsqueda diaria. Todo queda en un solo lugar, ordenado.",
  ],
  [
    "¿Garantizan que voy a conseguir trabajo?",
    "No. La herramienta te ayuda a organizar tu búsqueda, pero no garantiza empleo ni resultados. Las decisiones sobre a qué te postulás y cómo seguís son tuyas.",
  ],
  [
    "¿Dónde se guardan mis datos?",
    "Tus datos se guardan en tu cuenta. Además, desde la app podés exportarlos como un archivo de respaldo para tenerlos también por tu lado.",
  ],
  [
    "¿Qué significa el porcentaje de coincidencia?",
    "Es una estimación local y orientativa de cuánto se parece tu CV a la oferta que cargaste. Sirve como una referencia para priorizar; no es un resultado oficial ni una promesa sobre el proceso.",
  ],
  [
    "¿Cómo funciona el informe con IA?",
    "Es opcional. La herramienta te arma un prompt que copiás y pegás en la IA que prefieras. En ese prompt, los datos de contacto de tu CV van tapados.",
  ],
  [
    "¿Los servicios adicionales están incluidos?",
    "No, se consultan aparte. Escribinos por WhatsApp desde el botón Consultar del servicio que te interese y lo coordinamos.",
  ],
  [
    "¿Para quién es?",
    "Para profesionales IT de Latinoamérica: trainee, junior, semi senior y senior.",
  ],
] as const;

/**
 * Accordion built on native `<details>`, so keyboard and screen reader behavior come for free.
 * The open/close animation is progressive enhancement in `globals.css` (`.faq-item`).
 */
export function FaqSection() {
  return (
    <section id="preguntas" className="py-section-sm md:py-section">
      <div className="reveal mx-auto max-w-3xl px-4">
        <h2 className="text-center font-display text-hero font-extrabold">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="faq-item group">
              <summary className="faq-summary flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-control py-3 font-display text-section font-semibold hover:text-accent [&::-webkit-details-marker]:hidden">
                {question}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="faq-chevron size-5 shrink-0 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </summary>
              <p className="pb-4 text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
