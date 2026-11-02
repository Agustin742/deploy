import type { Profile } from "@/features/state/domain/types";

const SAMPLE_NAME_OF_OLDER_VERSIONS = "Iván Gonzalez";

const NOT_A_NAME_CHARS = /[\d@:/|•●]|https?|www\./i;
const NOT_A_NAME_WORDS =
  /(curriculum|vitae|\bcv\b|perfil|resumen|experiencia|educaci|desarrollador|developer|engineer|ingenier)/i;
const CONNECTORS = /^(de|del|la|las|los|da|das|do|dos|van|von|y)$/i;

/** The name comes from the CV: the first line among the top ones that looks like a proper name. */
export function guessName(cv: string | null | undefined): string {
  const lines = String(cv || "")
    .split("\n")
    .map((l) => l.replace(/^[#*\s_>-]+|[*_\s]+$/g, "").trim())
    .filter(Boolean)
    .slice(0, 6);
  for (const line of lines) {
    if (line.length < 4 || line.length > 60 || NOT_A_NAME_CHARS.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    if (NOT_A_NAME_WORDS.test(line)) continue;
    if (words.every((x) => /^[A-ZÁÉÍÓÚÑÜ]/.test(x) || CONNECTORS.test(x))) {
      return words
        .map((x) => (x === x.toUpperCase() && x.length > 2 ? x[0] + x.slice(1).toLowerCase() : x))
        .join(" ");
    }
  }
  return "";
}

/** Applies the name sync rule and returns a new profile (the input is not mutated). */
export function syncProfileName(profile: Profile): Profile {
  const p = { ...profile };
  if (p.name === SAMPLE_NAME_OF_OLDER_VERSIONS && p.nameAuto !== false) {
    p.name = "";
    p.nameAuto = true;
  }
  if (p.nameAuto !== false) {
    const guessed = guessName(p.cv);
    if (guessed || !p.cv) p.name = guessed;
  }
  return p;
}
