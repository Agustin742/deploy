import type {
  EnglishMatch,
  MatchComponent,
  MatchResult,
  Profile,
} from "@/features/state/domain/types";
import { todayIso } from "@/shared/lib/dates";
import { escapeRegExp, norm } from "@/shared/lib/text";
import { SKILLS, STOP_WORDS, type Skill, type SkillKind } from "./skills";

export const ENG_TXT = ["", "Básico", "Intermedio (B2)", "Avanzado (C1+)"] as const;

export const hasSkill = (text: string, skill: Skill): boolean => skill.res.some((r) => r.test(text));

/** Keyword candidates: normalized words of 4+ characters that are not stop words or plain numbers. */
export const tokens = (t: string): string[] =>
  (t.match(/[a-z0-9][a-z0-9+#.-]{2,}/g) || [])
    .map((w) => w.replace(/[.-]+$/, ""))
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !STOP_WORDS.has(w));

/** Years of experience the offer asks for (smallest figure near "experiencia", else the first figure). */
export function reqYears(t: string): number | null {
  const re = /(\d{1,2})\s*\+?\s*(?:a[nñ]os|years?|yrs)/g;
  let m: RegExpExecArray | null;
  let best: number | null = null;
  let any: number | null = null;
  while ((m = re.exec(t))) {
    const n = +m[1];
    if (n < 1 || n > 15) continue;
    const context = t.slice(Math.max(0, m.index - 60), m.index + 90);
    if (/experienc/.test(context)) best = best === null ? n : Math.min(best, n);
    else if (any === null) any = n;
  }
  return best ?? any;
}

/** Largest plausible "N years" figure in a text (used to infer the candidate's experience from the CV). */
export function maxYears(t: string): number | null {
  const re = /(\d{1,2})\s*\+?\s*(?:a[nñ]os|years?)/g;
  let m: RegExpExecArray | null;
  let mx: number | null = null;
  while ((m = re.exec(t))) {
    const n = +m[1];
    if (n >= 1 && n <= 40) mx = Math.max(mx || 0, n);
  }
  return mx;
}

/** English level requested: 0 none, 1 basic, 2 intermediate, 3 advanced. */
export function engLevel(t: string): number {
  const i = t.search(/ingles|english/);
  if (i < 0) return 0;
  const c = t.slice(Math.max(0, i - 80), i + 100);
  if (/\b(c1|c2|avanzado|advanced|fluent|fluido|nativo|native|bilingue|bilingual)\b/.test(c)) return 3;
  if (/\b(b2|intermedio|intermediate|conversacional|conversational|upper)\b/.test(c)) return 2;
  if (/\b(a2|b1|basico|basic|elemental)\b/.test(c)) return 1;
  return 2;
}

export type BandToken = "ok" | "warn" | "bad";

export const band = (p: number): [BandToken, string] =>
  p >= 75 ? ["ok", "Alto"] : p >= 50 ? ["warn", "Medio"] : ["bad", "Bajo"];

export const hasCv = (profile: Pick<Profile, "cv">): boolean =>
  (profile.cv || "").trim().length >= 40;

interface FoundSkill {
  n: string;
  k: SkillKind;
}

export function computeMatch(
  jdRaw: string,
  p: Pick<Profile, "cv" | "headline" | "extraSkills" | "english" | "years">,
  today: string = todayIso(),
): MatchResult {
  const j = norm(jdRaw);
  if (j.trim().length < 40) return { err: "jd" };
  const cvRaw = (p.cv || "") + "\n" + (p.headline || "") + "\n" + (p.extraSkills || "");
  if (cvRaw.trim().length < 40) return { err: "cv" };
  const cv = norm(cvRaw);
  const custom = (p.extraSkills || "")
    .split(/[,;\n]/)
    .map((s) => norm(s).trim())
    .filter((s) => s.length >= 2);

  const jdSk: FoundSkill[] = [];
  const cvSk = new Set<string>();
  SKILLS.forEach((s) => {
    if (hasSkill(j, s)) {
      jdSk.push(s);
      if (hasSkill(cv, s)) cvSk.add(s.n);
    }
  });
  custom.forEach((c) => {
    if (SKILLS.some((s) => s.res.some((r) => r.test(c)))) return;
    const r = new RegExp(`(?<![a-z0-9+#])${escapeRegExp(c)}(?![a-z0-9+#])`);
    if (r.test(j)) {
      jdSk.push({ n: c, k: "h" });
      cvSk.add(c);
    }
  });
  const hard = jdSk.filter((s) => s.k === "h");
  const soft = jdSk.filter((s) => s.k === "s");
  const hardM = hard.filter((s) => cvSk.has(s.n)).map((s) => s.n);
  const hardX = hard.filter((s) => !cvSk.has(s.n)).map((s) => s.n);
  const softM = soft.filter((s) => cvSk.has(s.n)).map((s) => s.n);
  const softX = soft.filter((s) => !cvSk.has(s.n)).map((s) => s.n);

  // keywords of the offer that are not skills
  const freq = new Map<string, number>();
  const order: string[] = [];
  tokens(j)
    .filter((w) => !SKILLS.some((k) => hasSkill(w, k)) && !/^(html|css)\d$/.test(w))
    .forEach((w) => {
      if (!freq.has(w)) {
        freq.set(w, 0);
        order.push(w);
      }
      freq.set(w, (freq.get(w) as number) + 1);
    });
  const pos = new Map(order.map((w, i) => [w, i]));
  const top = [...order]
    .sort((a, b) => (freq.get(b) as number) - (freq.get(a) as number) || (pos.get(a) as number) - (pos.get(b) as number))
    .slice(0, 25);
  const cvPre = new Set(tokens(cv).map((w) => w.slice(0, 6)));
  const kwX = top.filter((w) => !cvPre.has(w.slice(0, 6)));
  const kwR = top.length ? (top.length - kwX.length) / top.length : null;

  // English
  const er = engLevel(j);
  let ec = Number(p.english) || 0;
  if (!ec) ec = engLevel(norm(p.cv || ""));
  const eng: EnglishMatch = { req: er, cv: ec, status: "No requerido" };
  let engS: number | null = null;
  if (er) {
    engS = ec >= er ? 1 : ec === 0 ? 0 : (ec / er) * 0.7;
    eng.status = ec >= er ? "Cumple" : ec === 0 ? "No cumple" : "Parcial";
  }

  // Experience
  const yr = reqYears(j);
  const yc: number | null =
    p.years !== "" && p.years != null ? Number(p.years) : maxYears(norm(p.cv || ""));
  let expS: number | null = null;
  if (yr && yc != null && !isNaN(yc)) expS = Math.min(1, yc / yr);

  const comps: MatchComponent[] = [
    {
      k: "Habilidades técnicas",
      w: 50,
      s: hard.length ? hardM.length / hard.length : null,
      d: hard.length ? `${hardM.length} de ${hard.length}` : "sin datos",
    },
    {
      k: "Palabras clave de la oferta",
      w: 15,
      s: kwR === null ? null : Math.min(1, kwR / 0.55),
      d: top.length ? `${top.length - kwX.length} de ${top.length}` : "sin datos",
    },
    {
      k: "Habilidades blandas",
      w: 10,
      s: soft.length ? softM.length / soft.length : null,
      d: soft.length ? `${softM.length} de ${soft.length}` : "no se piden",
    },
    { k: "Inglés", w: 10, s: engS, d: er ? `pide ${ENG_TXT[er]}` : "no se pide" },
    {
      k: "Años de experiencia",
      w: 15,
      s: expS,
      d: yr ? `pide ${yr}${yc != null && !isNaN(yc) ? ` · tenés ${yc}` : ""}` : "no se pide",
    },
  ];
  const active = comps.filter((c) => c.s !== null);
  const totalWeight = active.reduce((a, c) => a + c.w, 0) || 1;
  const pct = Math.round((active.reduce((a, c) => a + c.w * (c.s as number), 0) / totalWeight) * 100);
  const cumple = pct >= 75 && eng.status !== "No cumple" ? "Sí" : pct >= 50 ? "Parcial" : "No";
  return { pct, comps, hardM, hardX, softM, softX, kwX: kwX.slice(0, 10), eng, yr, yc, cumple, at: today };
}
