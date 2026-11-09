import { PLATS } from "@/features/applications/domain/platforms";
import { blank } from "@/features/state/domain/state";
import type { AppState, Application, Interview, Platform } from "@/features/state/domain/types";
import type { Command } from "./commands";
import {
  APP_FIELDS,
  BASE_FIELDS,
  BRAND_FIELDS,
  DRAFT_FIELDS,
  FICHA_FIELDS,
  INTERVIEW_FIELDS,
  MODULE_FIELDS,
  PROFILE_FIELDS,
  REGISTRY_FIELDS,
  REGISTRY_KEYS,
  type FieldSpec,
} from "./field-specs";

type Loose = Record<string, unknown>;

/** A change the command set cannot express (or that cannot be told apart safely). */
class Unsupported extends Error {}

const same = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

const validValue = (kind: "s" | "b", value: unknown): boolean => (kind === "s" ? typeof value === "string" : typeof value === "boolean");

/** The allow-listed, well-typed fields of an object: what a command may carry, nothing else. */
function pick(spec: FieldSpec, source: unknown): Loose {
  const out: Loose = {};
  const obj = (source ?? {}) as Loose;
  for (const [key, kind] of Object.entries(spec)) {
    if (validValue(kind, obj[key])) out[key] = obj[key];
  }
  return out;
}

/** The fields whose value changed, or undefined when none did. */
function patch(spec: FieldSpec, prev: unknown, next: unknown): Loose | undefined {
  const before = (prev ?? {}) as Loose;
  const after = pick(spec, next);
  const changed: Loose = {};
  for (const key of Object.keys(after)) if (after[key] !== before[key]) changed[key] = after[key];
  return Object.keys(changed).length ? changed : undefined;
}

interface ListDiff<T> {
  removed: T[];
  /** New items in the order they appear in the new list (they all sit before the kept ones). */
  added: T[];
  kept: Array<[prev: T, next: T]>;
}

/**
 * Compares two id-keyed lists. The server inserts new rows first and keeps the others in place, so
 * the new list must be `added ++ kept in the same order`; anything else (a reorder, duplicate ids)
 * cannot be expressed as add/remove commands.
 */
function diffList<T extends { id: string }>(prev: T[], next: T[], appendAdded = false): ListDiff<T> {
  const prevIds = new Set(prev.map((x) => x.id));
  const nextIds = new Set(next.map((x) => x.id));
  if (prevIds.size !== prev.length || nextIds.size !== next.length) throw new Unsupported("duplicate ids");

  const added = next.filter((x) => !prevIds.has(x.id));
  const nextKept = next.filter((x) => prevIds.has(x.id));
  const prevKept = prev.filter((x) => nextIds.has(x.id));
  if (!nextKept.every((x, i) => x.id === prevKept[i].id)) throw new Unsupported("reordered");
  const expected = appendAdded ? [...nextKept, ...added] : [...added, ...nextKept];
  if (!expected.every((x, i) => x.id === next[i].id)) throw new Unsupported("added items are not where the server puts them");

  const byId = new Map(prev.map((x) => [x.id, x]));
  return {
    removed: prev.filter((x) => !nextIds.has(x.id)),
    added,
    kept: nextKept.map((n) => [byId.get(n.id) as T, n] as [T, T]),
  };
}

/** Interviews and checklist of an application as a command payload. */
const interviewPayload = (i: Interview): Interview => ({ id: i.id, ...pick(INTERVIEW_FIELDS, i) });

function checklistPayload(pre: Application["pre"]): Application["pre"] | undefined {
  if (!pre) return undefined;
  const out: NonNullable<Application["pre"]> = {};
  for (const [key, item] of Object.entries(pre)) {
    const entry: { ok?: boolean; txt?: string } = {};
    if (typeof item?.ok === "boolean") entry.ok = item.ok;
    if (typeof item?.txt === "string") entry.txt = item.txt;
    out[key] = entry;
  }
  return out;
}

function applicationPayload(a: Application): Application {
  const app = {
    id: a.id,
    ...pick(APP_FIELDS, a),
    match: a.match ?? null,
    ficha: pick(FICHA_FIELDS, a.ficha),
    entrevistas: (a.entrevistas ?? []).map(interviewPayload),
  } as unknown as Application;
  const pre = checklistPayload(a.pre);
  if (pre) app.pre = pre;
  return app;
}

function diffProfileLike(
  type: "profile.setFields" | "base.setFields" | "brand.setFields" | "draft.setFields",
  spec: FieldSpec,
  prev: unknown,
  next: unknown,
): Command[] {
  if (prev === next) return [];
  const fields = patch(spec, prev, next);
  return fields ? [{ type, fields } as unknown as Command] : [];
}

function diffDraft(prev: AppState["draft"], next: AppState["draft"]): Command[] {
  if (prev === next) return [];
  const fields = patch(DRAFT_FIELDS, prev, next);
  if (!fields) return [];
  // Clearing the form is its own action; one field emptied by typing stays a plain edit.
  if (Object.keys(fields).length > 1 && same(next, blank().draft)) return [{ type: "draft.clear" }];
  return [{ type: "draft.setFields", fields } as Command];
}

function diffMods(prev: AppState["mods"], next: AppState["mods"]): Command[] {
  if (prev === next) return [];
  const changed = patch(MODULE_FIELDS, prev, next) ?? {};
  return Object.entries(changed).map(([mod, enabled]) => ({ type: "module.set", mod, enabled }) as Command);
}

const sameDefault = (a: Platform, b: Platform) => a.id === b.id && a.name === b.name && a.url === b.url && !a.custom && !b.custom;

function diffPlatforms(prev: Platform[], next: Platform[]): Command[] {
  if (prev === next) return [];
  const { removed, added, kept } = diffList(prev, next, true);
  const out: Command[] = removed.map((p) => ({ type: "platform.remove", id: p.id }));
  for (const [before, after] of kept) {
    if (Boolean(before.custom) !== Boolean(after.custom)) throw new Unsupported("platform flag");
    if (before.name !== after.name || before.url !== after.url) {
      out.push({ type: "platform.update", id: after.id, name: after.name, url: after.url });
    }
  }
  const keptIds = new Set(kept.map(([, n]) => n.id));
  const missingDefaults = PLATS.filter((d) => !keptIds.has(d.id));
  if (added.length && added.length === missingDefaults.length && added.every((p, i) => sameDefault(p, missingDefaults[i]))) {
    out.push({ type: "platform.restoreDefaults" });
  } else {
    for (const p of added) {
      const platform: Platform = { id: p.id, name: p.name, url: p.url };
      if (p.custom !== undefined) platform.custom = p.custom;
      out.push({ type: "platform.add", platform });
    }
  }
  return out;
}

const daysOf = (checks: AppState["checks"], month: string, platformId: string): number[] =>
  Array.isArray(checks[month]?.[platformId]) ? checks[month][platformId] : [];

function diffChecks(prev: AppState, next: AppState): Command[] {
  if (prev.checks === next.checks) return [];
  const platformIds = new Set(next.platforms.map((p) => p.id));
  const months = new Set([...Object.keys(prev.checks), ...Object.keys(next.checks)]);
  const out: Command[] = [];
  for (const month of [...months].sort()) {
    const ids = new Set([...Object.keys(prev.checks[month] ?? {}), ...Object.keys(next.checks[month] ?? {})]);
    const byDay = new Map<number, string[]>();
    for (const platformId of ids) {
      // Checks of a removed platform go with it (cascade).
      if (!platformIds.has(platformId)) continue;
      const before = new Set(daysOf(prev.checks, month, platformId));
      const after = new Set(daysOf(next.checks, month, platformId));
      for (const day of [...after].filter((d) => !before.has(d)).sort((a, b) => a - b)) {
        byDay.set(day, [...(byDay.get(day) ?? []), platformId]);
      }
      for (const day of [...before].filter((d) => !after.has(d)).sort((a, b) => a - b)) {
        out.push({ type: "check.set", month, platformId, day, checked: false });
      }
    }
    for (const [day, ofDay] of [...byDay].sort(([a], [b]) => a - b)) {
      // Every platform checked for the day at once is "mark the day".
      if (ofDay.length > 1 && ofDay.length === platformIds.size) out.push({ type: "check.markDay", month, day });
      else for (const platformId of ofDay) out.push({ type: "check.set", month, platformId, day, checked: true });
    }
  }
  return out;
}

function diffInterviews(appId: string, prev: Interview[], next: Interview[]): Command[] {
  if (prev === next) return [];
  const { removed, added, kept } = diffList(prev, next);
  const out: Command[] = removed.map((i) => ({ type: "interview.remove", appId, id: i.id }));
  for (const [before, after] of kept) {
    const fields = patch(INTERVIEW_FIELDS, before, after);
    if (fields) out.push({ type: "interview.setFields", appId, id: after.id, fields });
  }
  // The server puts each new row first, so the first one sent ends up last.
  for (const interview of [...added].reverse()) out.push({ type: "interview.add", appId, interview: interviewPayload(interview) });
  return out;
}

function diffChecklist(appId: string, prev: Application["pre"], next: Application["pre"]): Command[] {
  if (prev === next) return [];
  const before = prev ?? {};
  const after = next ?? {};
  if (Object.keys(before).some((key) => !(key in after))) throw new Unsupported("checklist item removed");
  const out: Command[] = [];
  for (const [key, item] of Object.entries(after)) {
    const ok = typeof item?.ok === "boolean" && item.ok !== before[key]?.ok ? item.ok : undefined;
    const txt = typeof item?.txt === "string" && item.txt !== before[key]?.txt ? item.txt : undefined;
    if (ok === undefined && txt === undefined) continue;
    out.push({
      type: "checklist.set",
      appId,
      key,
      ...(ok === undefined ? {} : { ok }),
      ...(txt === undefined ? {} : { txt }),
    });
  }
  return out;
}

function diffApp(prev: Application, next: Application): Command[] {
  if (prev === next) return [];
  const fields = patch(APP_FIELDS, prev, next);
  const ficha = patch(FICHA_FIELDS, prev.ficha, next.ficha);
  const matchChanged = !same(prev.match ?? null, next.match ?? null);
  const out: Command[] = [];
  if (fields || ficha || matchChanged) {
    out.push({
      type: "app.setFields",
      id: next.id,
      ...(fields ? { fields } : {}),
      ...(ficha ? { ficha } : {}),
      ...(matchChanged ? { match: next.match ?? null } : {}),
    } as Command);
  }
  out.push(...diffInterviews(next.id, prev.entrevistas ?? [], next.entrevistas ?? []));
  out.push(...diffChecklist(next.id, prev.pre, next.pre));
  return out;
}

function diffApps(prev: Application[], next: Application[]): Command[] {
  if (prev === next) return [];
  const { removed, added, kept } = diffList(prev, next);
  const out: Command[] = removed.map((a) => ({ type: "app.remove", id: a.id }));
  for (const [before, after] of kept) out.push(...diffApp(before, after));
  for (const app of [...added].reverse()) out.push({ type: "app.create", app: applicationPayload(app) });
  return out;
}

function diffRegistries(prev: AppState, next: AppState): Command[] {
  const out: Command[] = [];
  for (const kind of REGISTRY_KEYS) {
    const before = prev[kind] as unknown as Array<{ id: string } & Loose>;
    const after = next[kind] as unknown as Array<{ id: string } & Loose>;
    if (before === after) continue;
    const spec = REGISTRY_FIELDS[kind];
    const { removed, added, kept } = diffList(before, after);
    for (const item of removed) out.push({ type: "registry.remove", kind, id: item.id });
    for (const [was, now] of kept) {
      const fields = patch(spec, was, now);
      if (fields) out.push({ type: "registry.setFields", kind, id: now.id, fields } as Command);
    }
    for (const item of [...added].reverse()) {
      out.push({ type: "registry.add", kind, item: { id: item.id, ...pick(spec, item) } } as Command);
    }
  }
  return out;
}

function diffPlan(prev: AppState, next: AppState): Command[] {
  const out: Command[] = [];
  if (prev.planVars !== next.planVars) {
    const weeks = new Set([...Object.keys(prev.planVars), ...Object.keys(next.planVars)]);
    for (const week of [...weeks].sort()) {
      const was = prev.planVars[week] ?? [];
      const now = next.planVars[week] ?? [];
      if (!same(was, now)) out.push({ type: "plan.setWeekVars", week, varIds: [...now] });
    }
  }
  if (prev.metas !== next.metas) {
    if (Object.keys(prev.metas).some((key) => !(key in next.metas))) throw new Unsupported("target removed");
    for (const [key, value] of Object.entries(next.metas)) {
      if (typeof value === "string" && prev.metas[key] !== value) out.push({ type: "plan.setTarget", key, value });
    }
  }
  return out;
}

/**
 * The commands that turn the server's copy of `prev` into `next`. Every change the UI can make has a
 * command; the few it cannot express (review frequency, the unused contacts list, reordering, removing
 * a saved target or checklist item) make the whole diff a single `state.replace` instead, so nothing is
 * ever left out. The commands carry the resulting values only, so no UI or matching logic runs on the server.
 */
export function diffState(prev: AppState, next: AppState): Command[] {
  if (prev === next) return [];
  if (prev.revFreq !== next.revFreq || !same(prev.contactos, next.contactos)) return [{ type: "state.replace", state: next }];
  try {
    return [
      ...diffProfileLike("profile.setFields", PROFILE_FIELDS, prev.profile, next.profile),
      ...(prev.goal !== next.goal || prev.goalSet !== next.goalSet ? [{ type: "goal.set", goal: next.goal, goalSet: next.goalSet } as Command] : []),
      ...diffProfileLike("base.setFields", BASE_FIELDS, prev.base, next.base),
      ...diffProfileLike("brand.setFields", BRAND_FIELDS, prev.marca, next.marca),
      ...diffMods(prev.mods, next.mods),
      ...diffDraft(prev.draft, next.draft),
      ...diffPlatforms(prev.platforms, next.platforms),
      ...diffChecks(prev, next),
      ...diffApps(prev.apps, next.apps),
      ...diffPlan(prev, next),
      ...diffRegistries(prev, next),
    ];
  } catch (error) {
    if (error instanceof Unsupported) return [{ type: "state.replace", state: next }];
    throw error;
  }
}
