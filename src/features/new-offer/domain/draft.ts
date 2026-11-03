import { guessSource, newApp, recalcMatch } from "@/features/applications/domain/applications";
import { JD_EXAMPLE } from "@/features/matching/domain/example";
import { blank } from "@/features/state/domain/state";
import type { AppState, Draft } from "@/features/state/domain/types";
import { uid } from "@/shared/lib/ids";

export const DRAFT_EMPTY_MESSAGE = "Completá al menos empresa o puesto";

/** Sets one field of the new-offer draft; a pasted link also detects the source while it is empty. */
export function setDraftField(state: AppState, key: keyof Draft, value: string): AppState {
  const draft = { ...state.draft, [key]: value };
  if (key === "link" && !state.draft.fuente) {
    const guessed = guessSource(value, state.platforms);
    if (guessed) draft.fuente = guessed;
  }
  return { ...state, draft };
}

export const fillExample = (state: AppState): AppState => ({
  ...state,
  draft: { ...state.draft, jd: JD_EXAMPLE, puesto: state.draft.puesto || "Frontend Developer" },
});

export const clearDraft = (state: AppState): AppState => ({ ...state, draft: blank().draft });

export type SaveDraftResult =
  | { ok: true; state: AppState; appId: string }
  | { ok: false; message: string };

/** Turns the draft into an application (on top of the list) and clears the draft. */
export function saveDraft(state: AppState, today: string, newId: () => string = uid): SaveDraftResult {
  const d = state.draft;
  if (!d.empresa.trim() && !d.puesto.trim()) return { ok: false, message: DRAFT_EMPTY_MESSAGE };
  const app = recalcMatch(
    newApp(
      { id: newId(), empresa: d.empresa.trim(), puesto: d.puesto.trim(), link: d.link.trim(), fuente: d.fuente, estado: d.estado, jd: d.jd },
      today,
    ),
    state.profile,
    today,
  );
  return { ok: true, appId: app.id, state: { ...state, apps: [app, ...state.apps], draft: blank().draft } };
}
