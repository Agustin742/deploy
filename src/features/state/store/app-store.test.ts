import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addInterview, applyAppEdit, recalcAll, recalcOne, removeApp, removeInterview } from "@/features/applications/domain/edit";
import { setProfileField, setCvText } from "@/features/cv/domain/profile-edit";
import { addPlatform, markAllToday, removePlatform, resetPlatforms, toggleCheck, updatePlatform } from "@/features/daily-search/domain/daily-search";
import { clearDraft, fillExample, saveDraft, setDraftField } from "@/features/new-offer/domain/draft";
import { toggleWeekVar } from "@/features/plan/domain/week-selection";
import { addItem, removeItem, setItemField } from "@/features/registries/domain/items";
import { createRegistryItem } from "@/features/registries/domain/registries";
import { DEBOUNCE_MS } from "@/features/sync/application/command-queue";
import type { StatePorts } from "@/features/sync/application/ports";
import type { ApplyResult } from "@/features/sync/domain/commands";
import sample from "../domain/__fixtures__/sample-state.json";
import { blank, hydrate } from "../domain/state";
import type { AppState } from "../domain/types";
import { withSyncedName } from "../domain/with-synced-name";
import { createAppStore, SAVE_FAILED_MESSAGE } from "./app-store";

const TODAY = "2026-03-11";
const server = (): AppState => withSyncedName(hydrate(structuredClone(sample), TODAY));
const setGoal = (goal: number) => (s: AppState): AppState => ({ ...s, goal, goalSet: true });

function setup(initial: AppState = server()) {
  const ports = {
    loadState: vi.fn(async () => ({ ok: true, state: initial }) as Awaited<ReturnType<StatePorts["loadState"]>>),
    applyCommands: vi.fn(async (): Promise<ApplyResult> => ({ ok: true })),
  };
  const onNotice = vi.fn();
  const onUnauthorized = vi.fn();
  const store = createAppStore({ ports, onNotice, onUnauthorized, today: () => TODAY });
  return { store, ports, onNotice, onUnauthorized, get: () => store.getState() };
}

async function loaded(initial?: AppState) {
  const t = setup(initial);
  await t.get().load();
  t.ports.loadState.mockClear();
  return t;
}

const sentTypes = (ports: { applyCommands: { mock: { calls: unknown[][] } } }) =>
  ports.applyCommands.mock.calls.flatMap(([batch]) => (batch as Array<{ type: string }>).map((c) => c.type));

describe("app store", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("loading from the server", () => {
    it("starts blank and not loaded", () => {
      const { get } = setup();
      expect(get().state).toEqual(withSyncedName(blank()));
      expect(get().loaded).toBe(false);
      expect(get().status).toBe("idle");
    });

    it("loads the state of the signed-in user", async () => {
      const { get, ports } = setup();
      const pending = get().load();
      expect(get().status).toBe("loading");
      await pending;
      expect(get().loaded).toBe(true);
      expect(get().status).toBe("ready");
      expect(get().state.apps).toHaveLength(7);
      expect(get().state.goal).toBe(10);
      expect(ports.loadState).toHaveBeenCalledTimes(1);
    });

    it("is idempotent: concurrent and later loads share one request and keep in-memory edits", async () => {
      const { get, ports } = setup();
      await Promise.all([get().load(), get().load()]);
      get().update(setGoal(3));
      await get().load();
      expect(ports.loadState).toHaveBeenCalledTimes(1);
      expect(get().state.goal).toBe(3);
    });

    it("reports a failed load and can retry", async () => {
      const { get, ports } = setup();
      ports.loadState.mockResolvedValueOnce({ ok: false, error: "failed" });
      await get().load();
      expect(get().status).toBe("error");
      expect(get().loaded).toBe(false);
      await get().load();
      expect(get().status).toBe("ready");
      expect(get().loaded).toBe(true);
    });

    it("treats a network error on load like a failed load", async () => {
      const { get, ports } = setup();
      ports.loadState.mockRejectedValueOnce(new Error("offline"));
      await get().load();
      expect(get().status).toBe("error");
    });

    it("leaves for the sign-in page when there is no session", async () => {
      const { get, ports, onUnauthorized } = setup();
      ports.loadState.mockResolvedValueOnce({ ok: false, error: "unauthorized" });
      await get().load();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(get().loaded).toBe(false);
    });

    it("ignores updates until the state is loaded, so the blank state never reaches the server", async () => {
      const { get, ports } = setup();
      get().update(setGoal(5), { immediate: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(get().state.goal).toBe(0);
      expect(ports.applyCommands).not.toHaveBeenCalled();
    });
  });

  describe("writes", () => {
    it("applies an update immediately in memory and sends it after the debounce", async () => {
      const { get, ports } = await loaded();
      get().update(setGoal(5));
      expect(get().state.goal).toBe(5);
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
      expect(ports.applyCommands).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(ports.applyCommands).toHaveBeenCalledWith([{ type: "goal.set", goal: 5, goalSet: true }]);
    });

    it("coalesces rapid edits into one command with the latest value", async () => {
      const { get, ports } = await loaded();
      get().update((s) => setProfileField(s, "headline", "a"));
      get().update((s) => setProfileField(s, "headline", "ab"));
      get().update((s) => setProfileField(s, "headline", "abc"));
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(ports.applyCommands).toHaveBeenCalledTimes(1);
      expect(ports.applyCommands).toHaveBeenCalledWith([{ type: "profile.setFields", fields: { headline: "abc" } }]);
    });

    it("sends immediate updates right away, after the edits still waiting", async () => {
      const { get, ports } = await loaded();
      get().update((s) => setProfileField(s, "headline", "typing"));
      get().update(setGoal(9), { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(ports.applyCommands).toHaveBeenCalledTimes(1);
      expect(ports.applyCommands).toHaveBeenCalledWith([
        { type: "profile.setFields", fields: { headline: "typing" } },
        { type: "goal.set", goal: 9, goalSet: true },
      ]);
    });

    it("sends nothing when the recipe changes nothing", async () => {
      const { get, ports } = await loaded();
      get().update((s) => s, { immediate: true });
      get().update((s) => ({ ...s }), { immediate: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(ports.applyCommands).not.toHaveBeenCalled();
    });

    it("flush sends pending edits without waiting", async () => {
      const { get, ports } = await loaded();
      get().update(setGoal(2));
      await expect(get().flush()).resolves.toBe(true);
      expect(ports.applyCommands).toHaveBeenCalledTimes(1);
    });
  });

  describe("every mutation call site sends its command", () => {
    const withJd = (s: AppState): AppState => ({
      ...s,
      profile: { ...s.profile, cv: "Zoe Lopez\nReact TypeScript developer" },
      apps: s.apps.map((a) => ({ ...a, jd: "Buscamos React y TypeScript" })),
    });
    const firstId = (s: AppState) => s.apps[0].id;
    const platform = (s: AppState) => s.platforms[0].id;
    const makeObjective = (s: AppState) => addItem(s, "objetivos", { ...createRegistryItem("objetivos", TODAY), id: "x-o1" });
    const makeDraft = (s: AppState) => ({ ...s, draft: { ...s.draft, empresa: "Acme", puesto: "Dev", jd: "x".repeat(60) } });

    interface Site {
      site: string;
      /** The server-side state before the action, when it is not the sample. */
      before?: (s: AppState) => AppState;
      recipe: (s: AppState) => AppState;
      types: string[];
    }

    const sites: Site[] = [
      { site: "cv: profile field", recipe: (s) => setProfileField(s, "english", "5"), types: ["profile.setFields"] },
      { site: "cv: file text", recipe: (s) => setCvText(s, "Ana Gomez\nDev"), types: ["profile.setFields"] },
      { site: "cv: recalculate all", before: withJd, recipe: (s) => recalcAll(s, "2026-06-01").state, types: ["app.setFields", "app.setFields"] /* only the applications whose match changed */ },
      { site: "summary: goal", recipe: setGoal(8), types: ["goal.set"] },
      { site: "plan: toggle week variable", recipe: (s) => toggleWeekVar(s, "2026-03-09", "postulaciones", true).state, types: ["plan.setWeekVars"] },
      { site: "plan: target", recipe: (s) => ({ ...s, metas: { ...s.metas, "x:1": "3" } }), types: ["plan.setTarget"] },
      { site: "plan: module", recipe: (s) => ({ ...s, mods: { ...s.mods, ia: !s.mods.ia } }), types: ["module.set"] },
      { site: "plan: direction", recipe: (s) => ({ ...s, base: { ...s.base, activos: "x" } }), types: ["base.setFields"] },
      { site: "plan: brand", recipe: (s) => ({ ...s, marca: { ...s.marca, titular: "x" } }), types: ["brand.setFields"] },
      { site: "new offer: field", recipe: (s) => setDraftField(s, "empresa", "Acme"), types: ["draft.setFields"] },
      { site: "new offer: example", recipe: fillExample, types: ["draft.setFields"] },
      { site: "new offer: clear", before: makeDraft, recipe: clearDraft, types: ["draft.clear"] },
      {
        site: "new offer: save",
        before: makeDraft,
        recipe: (s) => {
          const r = saveDraft(s, TODAY, () => "new1");
          if (!r.ok) throw new Error("should save");
          return r.state;
        },
        types: ["draft.clear", "app.create"],
      },
      { site: "applications: status", recipe: (s) => applyAppEdit(s, firstId(s), "estado", "Oferta"), types: ["app.setFields"] },
      { site: "applications: ficha", recipe: (s) => applyAppEdit(s, firstId(s), "ficha.notas", "x"), types: ["app.setFields"] },
      { site: "applications: checklist", recipe: (s) => applyAppEdit(s, firstId(s), "pre:cv:ok", true), types: ["checklist.set"] },
      { site: "drawer: add interview", recipe: (s) => addInterview(s, firstId(s), TODAY, () => "x-i1"), types: ["interview.add"] },
      {
        site: "drawer: interview field",
        before: (s) => addInterview(s, firstId(s), TODAY, () => "x-i1"),
        recipe: (s) => applyAppEdit(s, firstId(s), "ent:x-i1:etapa", "RRHH"),
        types: ["interview.setFields"],
      },
      {
        site: "drawer: remove interview",
        before: (s) => addInterview(s, firstId(s), TODAY, () => "x-i1"),
        recipe: (s) => removeInterview(s, firstId(s), "x-i1"),
        types: ["interview.remove"],
      },
      { site: "drawer: remove application", recipe: (s) => removeApp(s, firstId(s)), types: ["app.remove"] },
      { site: "drawer: recalculate match", before: withJd, recipe: (s) => recalcOne(s, firstId(s), "2026-06-01"), types: ["app.setFields"] },
      { site: "registry: add", recipe: (s) => addItem(s, "red", { ...createRegistryItem("red", TODAY), id: "x-r1" }), types: ["registry.add"] },
      {
        site: "registry: field",
        before: makeObjective,
        recipe: (s) => setItemField(s, "objetivos", "x-o1", "estado", "Hecho", TODAY),
        types: ["registry.setFields"],
      },
      { site: "registry: remove", before: makeObjective, recipe: (s) => removeItem(s, "objetivos", "x-o1"), types: ["registry.remove"] },
      { site: "daily search: toggle check", recipe: (s) => toggleCheck(s, "2026-03", platform(s), 4), types: ["check.set"] },
      { site: "daily search: mark all", recipe: (s) => markAllToday(s, "2026-07", 11), types: ["check.markDay"] },
      {
        site: "daily search: add page",
        recipe: (s) => {
          const r = addPlatform(s, "Computrabajo", "computrabajo.com");
          return r.ok ? r.state : s;
        },
        types: ["platform.add"],
      },
      {
        site: "daily search: edit page",
        recipe: (s) => {
          const r = updatePlatform(s, platform(s), "Otro nombre", "otro.com");
          return r.ok ? r.state : s;
        },
        types: ["platform.update"],
      },
      { site: "daily search: remove page", recipe: (s) => removePlatform(s, platform(s)), types: ["platform.remove"] },
      {
        site: "daily search: restore pages",
        before: (s) => ({ ...s, platforms: s.platforms.slice(2) }),
        recipe: (s) => resetPlatforms(s).state,
        types: ["platform.restoreDefaults"],
      },
      { site: "anything without a command", recipe: (s) => ({ ...s, revFreq: "semanal" }), types: ["state.replace"] },
    ];

    it.each(sites)("$site -> $types", async ({ before, recipe, types }) => {
      const { get, ports } = await loaded(before ? before(server()) : server());
      const prev = get().state;
      get().update(recipe, { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(get().state).not.toBe(prev);
      expect(sentTypes(ports)).toEqual(types);
    });
  });

  describe("failures", () => {
    it("tells the user, discards the optimistic state and reloads from the server", async () => {
      const { get, ports, onNotice } = await loaded();
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "conflict", index: 0 });
      get().update(setGoal(99), { immediate: true });
      expect(get().state.goal).toBe(99);
      await vi.advanceTimersByTimeAsync(0);
      expect(onNotice).toHaveBeenCalledWith(SAVE_FAILED_MESSAGE);
      expect(ports.loadState).toHaveBeenCalledTimes(1);
      expect(get().state.goal).toBe(10);
    });

    it("drops edits still waiting when a batch fails", async () => {
      const { get, ports } = await loaded();
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "failed" });
      get().update(setGoal(99), { immediate: true });
      get().update((s) => setProfileField(s, "headline", "lost"));
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);
      expect(ports.applyCommands).toHaveBeenCalledTimes(1);
      expect(get().state.profile.headline).not.toBe("lost");
    });

    it("treats a network error as a failure", async () => {
      const { get, ports, onNotice } = await loaded();
      ports.applyCommands.mockRejectedValueOnce(new Error("offline"));
      get().update(setGoal(99), { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(onNotice).toHaveBeenCalledWith(SAVE_FAILED_MESSAGE);
      expect(get().state.goal).toBe(10);
    });

    it("leaves for the sign-in page without reloading when the session expired", async () => {
      const { get, ports, onNotice, onUnauthorized } = await loaded();
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "unauthorized" });
      get().update(setGoal(99), { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(onNotice).not.toHaveBeenCalled();
      expect(ports.loadState).not.toHaveBeenCalled();
    });

    it("keeps the optimistic state and says so when the reload itself fails", async () => {
      const { get, ports, onNotice } = await loaded();
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "failed" });
      ports.loadState.mockResolvedValueOnce({ ok: false, error: "failed" });
      get().update(setGoal(99), { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(onNotice).toHaveBeenCalledTimes(2);
      expect(get().state.goal).toBe(99);
    });

    it("does not lose an edit made while the state is being reloaded", async () => {
      const { get, ports } = await loaded();
      let release: (v: Awaited<ReturnType<StatePorts["loadState"]>>) => void = () => {};
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "failed" });
      ports.loadState.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)));
      ports.loadState.mockResolvedValueOnce({ ok: true, state: { ...server(), goal: 7 } }); // what the server holds once the edit arrived
      get().update(setGoal(99), { immediate: true });
      await vi.advanceTimersByTimeAsync(0);
      get().update(setGoal(7), { immediate: true }); // typed while reloading
      release({ ok: true, state: server() });
      await vi.advanceTimersByTimeAsync(0);
      expect(ports.applyCommands).toHaveBeenLastCalledWith([{ type: "goal.set", goal: 7, goalSet: true }]);
      expect(get().state.goal).toBe(7);
    });
  });

  describe("importBackup", () => {
    const backup = { ...blank(), apps: [], profile: { ...blank().profile, cv: "Ana Gomez\nDev" }, goal: 3, goalSet: true };

    it("restores a valid backup through the server and reloads what was saved", async () => {
      const saved = { ...server(), goal: 3 };
      const { get, ports } = await loaded();
      ports.loadState.mockResolvedValueOnce({ ok: true, state: saved });
      expect(get().importBackup(backup)).toBe(true);
      expect(get().state.goal).toBe(3);
      expect(get().state.profile.name).toBe("Ana Gomez");
      await vi.advanceTimersByTimeAsync(0);
      expect(ports.applyCommands).toHaveBeenCalledTimes(1);
      const [[batch]] = ports.applyCommands.mock.calls as unknown as [[Array<{ type: string; state: AppState }>]];
      expect(batch.map((c) => c.type)).toEqual(["state.replace"]);
      expect(batch[0].state.profile.name).toBe("Ana Gomez");
      expect(ports.loadState).toHaveBeenCalledTimes(1);
      expect(get().state).toEqual(saved);
    });

    it("does not reload when the import failed on the server (the failure handler already did)", async () => {
      const { get, ports } = await loaded();
      ports.applyCommands.mockResolvedValueOnce({ ok: false, error: "failed" });
      get().importBackup(backup);
      await vi.advanceTimersByTimeAsync(0);
      expect(ports.loadState).toHaveBeenCalledTimes(1);
    });

    it("rejects data that is not a backup and leaves the state and the server untouched", async () => {
      const { get, ports } = await loaded();
      get().update(setGoal(8), { immediate: true });
      ports.applyCommands.mockClear();
      expect(get().importBackup({ nope: true })).toBe(false);
      expect(get().importBackup(null)).toBe(false);
      expect(get().importBackup({ apps: "x" })).toBe(false);
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(get().state.goal).toBe(8);
      expect(ports.applyCommands).not.toHaveBeenCalled();
    });
  });
});
