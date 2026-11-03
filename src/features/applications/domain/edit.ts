import type { AppState, Application } from "@/features/state/domain/types";
import { uid } from "@/shared/lib/ids";
import { recalcMatch, guessSource } from "./applications";

/** Applies `change` to one application, leaving the rest of the state untouched. */
function mapApp(state: AppState, id: string, change: (a: Application) => Application): AppState {
  if (!state.apps.some((a) => a.id === id)) return state;
  return { ...state, apps: state.apps.map((a) => (a.id === id ? change(a) : a)) };
}

type EditValue = string | boolean;

/**
 * Sets one field of an application. `path` is the data key of the legacy form:
 * `field`, `ficha.field`, `pre:<item>:<ok|txt>` or `ent:<interviewId>:<field>`.
 */
export function applyAppEdit(state: AppState, id: string, path: string, value: EditValue): AppState {
  return mapApp(state, id, (a) => {
    if (path.startsWith("pre:")) {
      const [, key, field] = path.split(":");
      const pre = a.pre ?? {};
      return { ...a, pre: { ...pre, [key]: { ...pre[key], [field]: value } } };
    }
    if (path.startsWith("ent:")) {
      const [, eid, field] = path.split(":");
      return { ...a, entrevistas: (a.entrevistas ?? []).map((e) => (e.id === eid ? { ...e, [field]: value } : e)) };
    }
    if (path.startsWith("ficha.")) {
      return { ...a, ficha: { ...a.ficha, [path.slice(6)]: value } };
    }
    const next = { ...a, [path]: value } as Application;
    if (path === "link" && !a.fuente) {
      const guessed = guessSource(String(value), state.platforms);
      if (guessed) next.fuente = guessed;
    }
    return next;
  });
}

export function addInterview(state: AppState, id: string, today: string, newId: () => string = uid): AppState {
  return mapApp(state, id, (a) => ({
    ...a,
    entrevistas: [
      { id: newId(), fecha: today, etapa: "", preguntas: "", respondi: "", prep: "", feedback: "", aprendi: "", proximo: "" },
      ...(a.entrevistas ?? []),
    ],
  }));
}

export const removeInterview = (state: AppState, id: string, interviewId: string): AppState =>
  mapApp(state, id, (a) => ({ ...a, entrevistas: (a.entrevistas ?? []).filter((e) => e.id !== interviewId) }));

export const removeApp = (state: AppState, id: string): AppState => ({
  ...state,
  apps: state.apps.filter((a) => a.id !== id),
});

/** Recomputes the match of one application against the current CV. */
export const recalcOne = (state: AppState, id: string, today: string): AppState =>
  mapApp(state, id, (a) => recalcMatch(a, state.profile, today));

/** Recomputes every application that has a job description. */
export function recalcAll(state: AppState, today: string): { state: AppState; count: number } {
  let count = 0;
  const apps = state.apps.map((a) => {
    if (!a.jd) return a;
    count++;
    return recalcMatch(a, state.profile, today);
  });
  return { state: { ...state, apps }, count };
}

/** After the job description changed: recompute the match, or drop it when the text is gone. */
export const refreshMatchFromJd = (state: AppState, id: string, today: string): AppState =>
  mapApp(state, id, (a) => {
    const next = recalcMatch(a, state.profile, today);
    return next.jd ? next : { ...next, match: null };
  });
