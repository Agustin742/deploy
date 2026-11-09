import { flag, str } from "@/shared/db/rows";
import type { FieldSpec } from "../domain/field-specs";

/** Row values for every field of `spec`, coercing missing ones like the full-state mappers do ('' / false). */
export function coerceFields(spec: FieldSpec, source: object): Record<string, string | boolean> {
  const values = source as Record<string, unknown>;
  return Object.fromEntries(Object.entries(spec).map(([key, kind]) => [key, kind === "b" ? flag(values[key]) : str(values[key])]));
}
