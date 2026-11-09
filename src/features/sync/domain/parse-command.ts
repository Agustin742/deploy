import { LISTAS } from "@/features/state/domain/state";
import type {
  AppState,
  Application,
  Base,
  CompanyProfile,
  Draft,
  Interview,
  Marca,
  MatchSuccess,
  ModKey,
  Platform,
  Profile,
} from "@/features/state/domain/types";
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
  hasOwn,
  type FieldSpec,
} from "./field-specs";

/** Largest batch a client may send in one call. */
export const MAX_BATCH = 200;

/** Client ids fit `varchar(64)`; checklist item keys, week variables and target keys `varchar(128)`. */
const ID_MAX = 64;
const KEY_MAX = 128;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const bounded = (v: unknown, max: number): v is string => isStr(v) && v.length >= 1 && v.length <= max;
const MONTH = /^\d{4}-\d{2}$/;
const DAY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDayOfMonth = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 31;

interface ReadOptions {
  /** Patches must set something; whole items may omit optional fields. */
  patch: boolean;
}

/**
 * Reads an object whose every key is on the allow-list with the right type.
 * Unknown keys (including `__proto__`, `userId`, `position`) reject the whole object.
 */
function readFields<T>(raw: unknown, spec: FieldSpec, { patch }: ReadOptions, extra: readonly string[] = []): T | null {
  if (!isObj(raw)) return null;
  const out: Obj = {};
  for (const key of Object.keys(raw)) {
    if (extra.includes(key)) continue;
    const kind = hasOwn(spec, key) ? spec[key] : undefined;
    const value = raw[key];
    if (value === undefined && !patch) continue;
    if (kind === "s" ? !isStr(value) : kind === "b" ? !isBool(value) : true) return null;
    out[key] = value;
  }
  if (patch && Object.keys(out).length === 0) return null;
  return out as T;
}

const patchOf = <T>(raw: unknown, spec: FieldSpec) => readFields<T>(raw, spec, { patch: true });
const itemOf = <T>(raw: unknown, spec: FieldSpec, extra?: readonly string[]) =>
  readFields<T>(raw, spec, { patch: false }, extra);

/** The derived match is a nested JSON blob; only its envelope is checked. */
function readMatch(raw: unknown): MatchSuccess | null | undefined {
  if (raw === null) return null;
  if (!isObj(raw) || typeof raw.pct !== "number" || !Array.isArray(raw.comps)) return undefined;
  return raw as unknown as MatchSuccess;
}

function readInterview(raw: unknown): Interview | null {
  const rest = itemOf<Omit<Interview, "id">>(raw, INTERVIEW_FIELDS, ["id"]);
  if (!rest || !isObj(raw) || !bounded(raw.id, ID_MAX)) return null;
  return { id: raw.id, ...rest };
}

function readChecklist(raw: unknown): Application["pre"] | null {
  if (!isObj(raw)) return null;
  const pre: NonNullable<Application["pre"]> = {};
  for (const key of Object.keys(raw)) {
    const item = raw[key];
    if (!bounded(key, KEY_MAX) || !isObj(item)) return null;
    const entry: { ok?: boolean; txt?: string } = {};
    for (const name of Object.keys(item)) {
      if (name === "ok" && isBool(item.ok)) entry.ok = item.ok;
      else if (name === "txt" && isStr(item.txt)) entry.txt = item.txt;
      else if (item[name] !== undefined) return null;
    }
    pre[key] = entry;
  }
  return pre;
}

function readApplication(raw: unknown): Application | null {
  const scalars = itemOf<Partial<Application>>(raw, APP_FIELDS, ["id", "match", "ficha", "entrevistas", "pre"]);
  if (!scalars || !isObj(raw) || !bounded(raw.id, ID_MAX)) return null;

  const match = raw.match === undefined ? null : readMatch(raw.match);
  if (match === undefined) return null;
  const ficha = raw.ficha === undefined ? {} : itemOf<Partial<CompanyProfile>>(raw.ficha, FICHA_FIELDS);
  if (!ficha) return null;
  if (raw.entrevistas !== undefined && !Array.isArray(raw.entrevistas)) return null;
  const entrevistas = ((raw.entrevistas as unknown[] | undefined) ?? []).map(readInterview);
  if (entrevistas.includes(null)) return null;
  const app: Obj = { ...scalars, id: raw.id, match, ficha, entrevistas };
  if (raw.pre !== undefined) {
    const pre = readChecklist(raw.pre);
    if (!pre) return null;
    app.pre = pre;
  }
  return app as unknown as Application;
}

function readPlatform(raw: unknown): Platform | null {
  if (!isObj(raw)) return null;
  const { id, name, url, custom, ...unknown } = raw;
  if (Object.keys(unknown).length || !bounded(id, ID_MAX) || !isStr(name) || !name.trim() || !isStr(url)) return null;
  if (custom !== undefined && !isBool(custom)) return null;
  return custom === undefined ? { id, name, url } : { id, name, url, custom };
}

/** A backup / full state: only its envelope is checked, `hydrate` and the row mappers do the rest. */
function readState(raw: unknown): AppState | null {
  if (!isObj(raw)) return null;
  for (const key of ["apps", "platforms", ...LISTAS]) {
    const list = raw[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || !list.every((x) => isObj(x) && bounded(x.id, ID_MAX))) return null;
  }
  for (const key of ["profile", "draft", "mods", "base", "marca", "checks", "metas", "planVars"]) {
    if (raw[key] !== undefined && !isObj(raw[key])) return null;
  }
  return raw as unknown as AppState;
}

function readCommand(raw: unknown): Command | null {
  if (!isObj(raw) || !isStr(raw.type)) return null;
  switch (raw.type) {
    case "profile.setFields": {
      const fields = patchOf<Partial<Profile>>(raw.fields, PROFILE_FIELDS);
      return fields && { type: raw.type, fields };
    }
    case "goal.set":
      return typeof raw.goal === "number" && Number.isFinite(raw.goal) && isBool(raw.goalSet)
        ? { type: raw.type, goal: raw.goal, goalSet: raw.goalSet }
        : null;
    case "base.setFields": {
      const fields = patchOf<Partial<Base>>(raw.fields, BASE_FIELDS);
      return fields && { type: raw.type, fields };
    }
    case "brand.setFields": {
      const fields = patchOf<Partial<Marca>>(raw.fields, BRAND_FIELDS);
      return fields && { type: raw.type, fields };
    }
    case "module.set":
      return isStr(raw.mod) && hasOwn(MODULE_FIELDS, raw.mod) && isBool(raw.enabled)
        ? { type: raw.type, mod: raw.mod as ModKey, enabled: raw.enabled }
        : null;
    case "draft.setFields": {
      const fields = patchOf<Partial<Draft>>(raw.fields, DRAFT_FIELDS);
      return fields && { type: raw.type, fields };
    }
    case "draft.clear":
    case "platform.restoreDefaults":
      return { type: raw.type };
    case "app.create": {
      const app = readApplication(raw.app);
      return app && { type: raw.type, app };
    }
    case "app.setFields": {
      if (!bounded(raw.id, ID_MAX)) return null;
      const command: Extract<Command, { type: "app.setFields" }> = { type: raw.type, id: raw.id };
      if (raw.fields !== undefined) {
        const fields = patchOf<NonNullable<typeof command.fields>>(raw.fields, APP_FIELDS);
        if (!fields) return null;
        command.fields = fields;
      }
      if (raw.ficha !== undefined) {
        const ficha = patchOf<Partial<CompanyProfile>>(raw.ficha, FICHA_FIELDS);
        if (!ficha) return null;
        command.ficha = ficha;
      }
      if (raw.match !== undefined) {
        const match = readMatch(raw.match);
        if (match === undefined) return null;
        command.match = match;
      }
      return command.fields || command.ficha || command.match !== undefined ? command : null;
    }
    case "app.remove":
    case "platform.remove":
      return bounded(raw.id, ID_MAX) ? { type: raw.type, id: raw.id } : null;
    case "interview.add": {
      const interview = readInterview(raw.interview);
      return bounded(raw.appId, ID_MAX) && interview ? { type: raw.type, appId: raw.appId, interview } : null;
    }
    case "interview.setFields": {
      const fields = patchOf<Partial<Omit<Interview, "id">>>(raw.fields, INTERVIEW_FIELDS);
      return bounded(raw.appId, ID_MAX) && bounded(raw.id, ID_MAX) && fields
        ? { type: raw.type, appId: raw.appId, id: raw.id, fields }
        : null;
    }
    case "interview.remove":
      return bounded(raw.appId, ID_MAX) && bounded(raw.id, ID_MAX)
        ? { type: raw.type, appId: raw.appId, id: raw.id }
        : null;
    case "checklist.set": {
      if (!bounded(raw.appId, ID_MAX) || !bounded(raw.key, KEY_MAX)) return null;
      if (raw.ok !== undefined && !isBool(raw.ok)) return null;
      if (raw.txt !== undefined && !isStr(raw.txt)) return null;
      if (raw.ok === undefined && raw.txt === undefined) return null;
      const command: Extract<Command, { type: "checklist.set" }> = { type: raw.type, appId: raw.appId, key: raw.key };
      if (raw.ok !== undefined) command.ok = raw.ok;
      if (raw.txt !== undefined) command.txt = raw.txt;
      return command;
    }
    case "platform.add": {
      const platform = readPlatform(raw.platform);
      return platform && { type: raw.type, platform };
    }
    case "platform.update":
      return bounded(raw.id, ID_MAX) && isStr(raw.name) && raw.name.trim() && isStr(raw.url)
        ? { type: raw.type, id: raw.id, name: raw.name, url: raw.url }
        : null;
    case "check.set":
      return isStr(raw.month) && MONTH.test(raw.month) && bounded(raw.platformId, ID_MAX) && isDayOfMonth(raw.day) && isBool(raw.checked)
        ? { type: raw.type, month: raw.month, platformId: raw.platformId, day: raw.day, checked: raw.checked }
        : null;
    case "check.markDay":
      return isStr(raw.month) && MONTH.test(raw.month) && isDayOfMonth(raw.day)
        ? { type: raw.type, month: raw.month, day: raw.day }
        : null;
    case "plan.setWeekVars":
      return isStr(raw.week) && DAY_ISO.test(raw.week) && Array.isArray(raw.varIds) && raw.varIds.every((v) => bounded(v, KEY_MAX))
        ? { type: raw.type, week: raw.week, varIds: [...raw.varIds] as string[] }
        : null;
    case "plan.setTarget":
      return bounded(raw.key, KEY_MAX) && isStr(raw.value) ? { type: raw.type, key: raw.key, value: raw.value } : null;
    case "registry.add": {
      if (!isStr(raw.kind) || !hasOwn(REGISTRY_FIELDS, raw.kind)) return null;
      const spec: FieldSpec = REGISTRY_FIELDS[raw.kind as keyof typeof REGISTRY_FIELDS];
      const rest = itemOf<Obj>(raw.item, spec, ["id"]);
      if (!rest || !isObj(raw.item) || !bounded(raw.item.id, ID_MAX)) return null;
      return { type: raw.type, kind: raw.kind, item: { id: raw.item.id, ...rest } } as Command;
    }
    case "registry.setFields": {
      if (!isStr(raw.kind) || !hasOwn(REGISTRY_FIELDS, raw.kind) || !bounded(raw.id, ID_MAX)) return null;
      const fields = patchOf<Obj>(raw.fields, REGISTRY_FIELDS[raw.kind as keyof typeof REGISTRY_FIELDS]);
      return fields && ({ type: raw.type, kind: raw.kind, id: raw.id, fields } as Command);
    }
    case "registry.remove":
      return isStr(raw.kind) && hasOwn(REGISTRY_FIELDS, raw.kind) && bounded(raw.id, ID_MAX)
        ? ({ type: raw.type, kind: raw.kind, id: raw.id } as Command)
        : null;
    case "state.replace": {
      const state = readState(raw.state);
      return state && { type: raw.type, state };
    }
    default:
      return null;
  }
}

/**
 * Validates one untrusted command. Returns a clean copy, or null when the shape is wrong,
 * the type is unknown, or any field / registry kind is not on the allow-list.
 */
export function parseCommand(raw: unknown): Command | null {
  const command = readCommand(raw);
  return command || null;
}

/** Validates a whole batch; one bad command rejects it all. */
export function parseCommands(raw: unknown): Command[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_BATCH) return null;
  const commands = raw.map(parseCommand);
  return commands.every((c): c is Command => c !== null) ? commands : null;
}
