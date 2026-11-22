import type { Offer } from "./offer";

// Offer catalog shown on the landing. No prices on purpose: access is arranged over WhatsApp.
export const OFERTA_DATA: Offer = {
  productos: [
    {
      n: "Herramienta Deploy your Career",
      d: "Organizá tu búsqueda laboral en un solo lugar y avanzá con un plan claro.",
      inc: [
        "Cargá tus postulaciones rápido, con la coincidencia con tu CV",
        "Tablero con tus números: estados, respuestas y postulaciones por mes",
        "Plan semanal y mensual con objetivos SMART",
        "Registro de tu red y de tu visibilidad en LinkedIn",
        "Preparación y registro de entrevistas"
      ]
    },
    {
      n: "Diagnóstico inicial de CV y LinkedIn",
      d: "Una primera revisión de tu CV y de tu perfil de LinkedIn para ver qué mejorar.",
      inc: [
        "Revisión de tu CV",
        "Revisión de tu perfil de LinkedIn",
        "Recomendaciones iniciales"
      ],
      gratis: true
    },
    {
      n: "Optimización de CV",
      d: "Tu CV redactado para el mercado IT de Latinoamérica.",
      inc: [
        "Redacción y estructura profesional",
        "Palabras clave para los filtros de selección"
      ]
    },
    {
      n: "Optimización de LinkedIn",
      d: "Un perfil que te encuentren los reclutadores.",
      inc: [
        "Titular, extracto y experiencia",
        "Estrategia de visibilidad"
      ]
    },
    {
      n: "Preparación para entrevistas",
      d: "Practicá y llegá a la entrevista con seguridad.",
      inc: [
        "Preguntas frecuentes del rubro IT",
        "Devolución sobre tus respuestas"
      ]
    },
    {
      n: "Estrategia de networking",
      d: "Cómo construir y usar tu red para llegar a más oportunidades.",
      inc: [
        "Plan de contactos",
        "Mensajes y seguimiento"
      ]
    }
  ]
};
