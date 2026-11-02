import type { Offer } from "./offer";

// To complete: prices per country (free text, e.g. 'ARS 45.000' or 'USD 39') and set
// borrador: false once everything is confirmed.
export const OFERTA_DATA: Offer = {
  borrador: true,
  paises: [
    "Argentina",
    "Bolivia",
    "Brasil",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Ecuador",
    "Guatemala",
    "México",
    "Paraguay",
    "Panamá",
    "República Dominicana",
    "Perú",
    "Uruguay"
  ],
  productos: [
    {
      n: "Herramienta Deploy your Career",
      tipo: "Producto digital · Pago único",
      d: "Organizá tu búsqueda laboral en un solo lugar y avanzá con un plan claro.",
      inc: [
        "Acceso por 1 año desde la fecha de pago",
        "Seguimiento de tus postulaciones y coincidencia con tu CV",
        "Plan semanal y mensual con objetivos SMART",
        "Registro de tu red y de tu visibilidad en LinkedIn",
        "Preparación y registro de entrevistas"
      ],
      precios: {}
    },
    {
      n: "Diagnóstico inicial de CV y LinkedIn",
      tipo: "Servicio",
      d: "Una primera revisión de tu CV y de tu perfil de LinkedIn para ver qué mejorar.",
      inc: [
        "Revisión de tu CV",
        "Revisión de tu perfil de LinkedIn",
        "Recomendaciones iniciales"
      ],
      gratis: true,
      precios: {}
    },
    {
      n: "Optimización de CV",
      tipo: "Servicio",
      d: "Tu CV redactado para el mercado IT de Latinoamérica.",
      inc: [
        "Redacción y estructura profesional",
        "Palabras clave para los filtros de selección"
      ],
      precios: {}
    },
    {
      n: "Optimización de LinkedIn",
      tipo: "Servicio",
      d: "Un perfil que te encuentren los reclutadores.",
      inc: [
        "Titular, extracto y experiencia",
        "Estrategia de visibilidad"
      ],
      precios: {}
    },
    {
      n: "Preparación para entrevistas",
      tipo: "Servicio",
      d: "Practicá y llegá a la entrevista con seguridad.",
      inc: [
        "Preguntas frecuentes del rubro IT",
        "Devolución sobre tus respuestas"
      ],
      precios: {}
    },
    {
      n: "Estrategia de networking",
      tipo: "Servicio",
      d: "Cómo construir y usar tu red para llegar a más oportunidades.",
      inc: [
        "Plan de contactos",
        "Mensajes y seguimiento"
      ],
      precios: {}
    }
  ]
};
