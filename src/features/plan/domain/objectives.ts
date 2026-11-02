import type { Objetivo } from "@/features/state/domain/types";
import { addDays, iso } from "@/shared/lib/dates";

/** Deadline of an objective: end of its month (monthly) or the Sunday of its week (weekly). */
export const plazoObj = (
  it: Pick<Objetivo, "periodo" | "mes" | "semana">,
  today: string,
): string => {
  if (it.periodo === "Mensual") {
    const [year, month] = (it.mes || today.slice(0, 7)).split("-").map(Number);
    return iso(new Date(year, month, 0));
  }
  return it.semana ? addDays(it.semana, 6) : "";
};

/** Gentle reminders for an objective that was written but is missing its deadline or indicator. */
export const objectiveWarnings = (it: Pick<Objetivo, "objetivo" | "plazo" | "indicador">): string[] => {
  const warnings: string[] = [];
  if (it.objetivo && !it.plazo) warnings.push("Falta el plazo.");
  if (it.objetivo && !it.indicador) {
    warnings.push("Falta el indicador: ¿cómo vas a saber que avanzó?");
  }
  return warnings;
};
