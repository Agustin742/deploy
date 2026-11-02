import { describe, expect, it } from "vitest";
import sample from "@/features/state/domain/__fixtures__/sample-state.json";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import golden from "./__fixtures__/legacy-registries.json";
import {
  createRegistryItem,
  defaultItem,
  fieldOptions,
  isFieldVisible,
  OPC,
  REGISTRIES,
  sortRegistry,
  type RegistryKey,
} from "./registries";

// legacy-registries.json was produced by running the original artifact's REG
// definitions on sample-state.json with today fixed to 2026-03-11.

const TODAY = "2026-03-11";
const state = { ...blank(), ...sample } as unknown as AppState;
const keys = Object.keys(REGISTRIES) as RegistryKey[];

describe("registry catalog", () => {
  it("has the same registries as the legacy artifact", () => {
    expect(keys).toEqual(
      Object.keys(golden).filter((k) => k !== "edge" && k !== "OPC"),
    );
  });

  it("keeps the shared option lists", () => {
    expect(OPC).toEqual(golden.OPC);
  });
});

describe.each(Object.keys(golden).filter((k) => k !== "edge" && k !== "OPC"))("registry %s", (name) => {
  const key = name as RegistryKey;
  const g = golden[key as keyof typeof golden] as (typeof golden)["objetivos"];
  const R = REGISTRIES[key];

  it("builds the default item", () => {
    expect(defaultItem(key, TODAY)).toEqual(g.def);
  });

  it("keeps field definitions (key, label, type, placeholder, module)", () => {
    expect(R.f.map((f) => [f.k, f.l, f.t, f.p ?? null, f.mod ?? null])).toEqual(
      g.fields.map((f) => [f.k, f.l, f.t, f.p, f.mod]),
    );
  });

  it("keeps the empty-state copy", () => {
    expect(R.empty).toEqual(g.empty);
  });

  it("builds titles and subtitles for the sample items", () => {
    const items = state[key] as never[];
    expect(items.map((it) => R.title(it))).toEqual(g.titles);
    if (g.subs) expect(items.map((it) => (R.sub ? R.sub(it) : ""))).toEqual(g.subs);
  });

  it("resolves select options", () => {
    const probes = key === "objetivos"
      ? [
          { periodo: "Semanal", semana: "2026-03-09", mes: "2026-03" },
          { periodo: "Mensual", semana: "", mes: "2026-03" },
        ]
      : [{}];
    g.fields.forEach((gf, i) => {
      const f = R.f[i];
      if (gf.o === null) {
        expect(f.o).toBeUndefined();
      } else if (Array.isArray(gf.o)) {
        expect(fieldOptions(f as never, probes[0] as never, { state, today: TODAY })).toEqual(gf.o);
      } else {
        const expected = (gf.o as { fn: string[][] }).fn;
        expect(
          probes.map((p) => fieldOptions(f as never, p as never, { state, today: TODAY })),
        ).toEqual(expected);
      }
    });
  });

  it("evaluates conditional field visibility", () => {
    const probes = key === "objetivos"
      ? [
          { periodo: "Semanal", semana: "2026-03-09", mes: "2026-03" },
          { periodo: "Mensual", semana: "", mes: "2026-03" },
        ]
      : [{}];
    g.fields.forEach((gf, i) => {
      if (!gf.showFor) return;
      expect(probes.map((p) => R.f[i].show?.(p as never))).toEqual(gf.showFor);
    });
  });

  it("sorts like the legacy list", () => {
    const items = (state[key] as { id: string }[]).slice();
    const ids = sortRegistry(key, items as never[]).map((it) => (it as { id: string }).id);
    if (g.sortIds) {
      expect(ids).toEqual(g.sortIds);
    } else {
      // no custom sort: newest date first when items have a date, else unchanged
      const dated = items.length > 0 && (items[0] as { fecha?: string }).fecha !== undefined;
      const expected = dated
        ? items
            .slice()
            .sort((a, b) =>
              ((b as { fecha?: string }).fecha || "").localeCompare((a as { fecha?: string }).fecha || ""),
            )
            .map((it) => it.id)
        : items.map((it) => it.id);
      expect(ids).toEqual(expected);
    }
  });
});

describe("title and subtitle edge cases", () => {
  const e = golden.edge;

  it("truncates long objective titles and falls back for empty ones", () => {
    expect(REGISTRIES.objetivos.title({ objetivo: "x".repeat(80) } as never)).toBe(e.objTitleLong);
    expect(REGISTRIES.objetivos.title({} as never)).toBe(e.objTitleEmpty);
  });

  it("describes monthly and weekly objectives", () => {
    expect(
      REGISTRIES.objetivos.sub?.({
        periodo: "Mensual",
        mes: "2026-03",
        variable: "V",
        prioridad: "Alta",
        estado: "Hecho",
      } as never),
    ).toBe(e.objSubMensual);
    expect(
      REGISTRIES.objetivos.sub?.({
        periodo: "Semanal",
        semana: "2026-03-09",
        variable: "",
        prioridad: "",
        estado: "Pendiente",
      } as never),
    ).toBe(e.objSubSemanal);
  });

  it("covers the remaining fallbacks", () => {
    expect(REGISTRIES.red.sub?.({ conexiones: "", paginas: "" } as never)).toBe(e.redSubEmpty);
    expect(REGISTRIES.posts.title({ tema: "", tipo: "Artículo" } as never)).toBe(e.postTitleFallback);
    expect(REGISTRIES.empleadores.title({ empresa: "" } as never)).toBe(e.empTitleEmpty);
    expect(REGISTRIES.experimentos.title({ rol: "" } as never)).toBe(e.expTitleEmpty);
    expect([true, false].map((cumplido) => REGISTRIES.descansos.sub?.({ cumplido } as never))).toEqual(
      e.descSubs,
    );
    expect(REGISTRIES.revisiones.sub?.({ desde: "", hasta: "" } as never)).toBe(e.revSubNo);
    expect(REGISTRIES.tiempos.sub?.({ fecha: "2026-03-05", est: "0", real: "" } as never)).toBe(
      e.tiempoSub,
    );
  });
});

describe("isFieldVisible", () => {
  it("hides fields of disabled modules and fields whose condition fails", () => {
    const f = { k: "x", l: "X", t: "t" as const, mod: "marca" as const };
    expect(isFieldVisible(f, {} as never, { ...blank().mods, marca: false })).toBe(false);
    expect(isFieldVisible(f, {} as never, { ...blank().mods, marca: true })).toBe(true);
    const g = REGISTRIES.objetivos.f.find((x) => x.k === "mes");
    expect(g && isFieldVisible(g, { periodo: "Semanal" } as never, blank().mods)).toBe(false);
    expect(g && isFieldVisible(g, { periodo: "Mensual" } as never, blank().mods)).toBe(true);
  });
});

describe("createRegistryItem", () => {
  it("adds a unique id to the default item", () => {
    const a = createRegistryItem("red", TODAY);
    const b = createRegistryItem("red", TODAY);
    expect(a).toMatchObject({ fecha: TODAY, conexiones: "", paginas: "", nota: "" });
    expect(a.id).not.toBe(b.id);
  });

  it("creates a weekly objective for the selected plan week with its deadline", () => {
    const o = createRegistryItem("objetivos", TODAY, { periodo: "Semanal", planWeek: "2026-03-02" });
    expect(o).toMatchObject({ periodo: "Semanal", semana: "2026-03-02", plazo: "2026-03-08" });
  });

  it("defaults to the current week and creates monthly objectives with month-end deadline", () => {
    expect(createRegistryItem("objetivos", TODAY)).toMatchObject({
      periodo: "Semanal",
      semana: "2026-03-09",
      plazo: "2026-03-15",
    });
    expect(createRegistryItem("objetivos", TODAY, { periodo: "Mensual" })).toMatchObject({
      periodo: "Mensual",
      semana: "2026-03-09",
      mes: "2026-03",
      plazo: "2026-03-31",
    });
  });
});
