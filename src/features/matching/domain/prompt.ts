import type { Profile } from "@/features/state/domain/types";
import { redact } from "@/features/profile/domain/redact";
import { ENG_TXT } from "./engine";

export const PROMPT_HEAD = `Prompt de Job Matching

Prompt integral para análisis de empleabilidad y postulación efectiva

A continuación te proporcionaré una descripción de un perfil profesional y una oferta laboral.

Quiero que hagas un análisis integral que incluya:

1. Análisis FODA:
● Fortalezas del perfil en relación con el puesto
● Oportunidades de mejora o desarrollo futuro
● Debilidades o carencias en relación con los requisitos
● Amenazas externas (mercado, competencia, barreras)

2. Porcentaje de job matching (0-100%) entre el perfil y el puesto, teniendo en cuenta:
● Formación académica
● Experiencia laboral
● Habilidades técnicas y blandas
● Idiomas y herramientas requeridas
● Cultura organizacional y valores (si están disponibles)

3. Recomendaciones personalizadas para la postulación:
● Qué destacar en el CV o carta de presentación
● Cómo adaptar el perfil de LinkedIn o portfolio (si corresponde)
● Sugerencias para enfrentar una posible entrevista
● Áreas de mejora o formación sugerida`;

/** Profile section of the prompt: the CV is redacted and the name is shared only with consent. */
export function cvBlock(p: Profile): string {
  return [
    p.shareName && p.name && `Nombre: ${p.name}`,
    p.headline && `Titular: ${p.headline}`,
    p.years !== "" && `Años de experiencia: ${p.years}`,
    p.english && `Inglés: ${ENG_TXT[Number(p.english)]}`,
    p.extraSkills && `Skills adicionales: ${p.extraSkills}`,
    "",
    redact(p.cv),
  ]
    .filter((x) => x !== false && x !== undefined && x !== null)
    .join("\n")
    .trim();
}

export interface PromptOffer {
  empresa: string;
  puesto: string;
  jd: string;
}

export const buildPrompt = (a: PromptOffer, profile: Profile): string =>
  `${PROMPT_HEAD}\n\nPerfil profesional:\n${cvBlock(profile)}\n\nOferta laboral:\n${a.empresa || a.puesto ? `${a.puesto || ""}${a.empresa ? ` en ${a.empresa}` : ""}\n\n` : ""}${a.jd}\n\nUsá solo la información provista: si falta algo, indicalo en vez de suponerlo, y marcá qué partes son inferencias. No prometas resultados ni empleo: es un insumo para que la persona decida.\n\nRespondé en español, con formato Markdown (títulos ### para cada sección, listas con guiones) y cerrá con el porcentaje final destacado.`;
