import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { addItem, removeItem, selectOptions, setItemField } from "./items";
import { createRegistryItem } from "./registries";

const TODAY = "2026-11-03"; // Tuesday

describe("addItem", () => {
  it("puts the new item first without mutating the state", () => {
    const state = blank();
    const a = createRegistryItem("red", TODAY);
    const b = createRegistryItem("red", TODAY);
    const one = addItem(state, "red", a);
    const two = addItem(one, "red", b);
    expect(state.red).toHaveLength(0);
    expect(two.red.map((r) => r.id)).toEqual([b.id, a.id]);
  });
});

describe("removeItem", () => {
  it("removes only the item with that id", () => {
    const a = createRegistryItem("posts", TODAY);
    const b = createRegistryItem("posts", TODAY);
    const state = addItem(addItem(blank(), "posts", a), "posts", b);
    expect(removeItem(state, "posts", a.id).posts.map((p) => p.id)).toEqual([b.id]);
  });
});

describe("setItemField", () => {
  it("sets a text field and ignores unknown ids", () => {
    const item = createRegistryItem("red", TODAY);
    const state = addItem(blank(), "red", item);
    const next = setItemField(state, "red", item.id, "conexiones", "250", TODAY);
    expect(next.red[0].conexiones).toBe("250");
    expect(state.red[0].conexiones).toBe("");
    expect(setItemField(state, "red", "nope", "conexiones", "1", TODAY)).toBe(state);
  });

  it("stores checkbox values as booleans", () => {
    const item = createRegistryItem("descansos", TODAY);
    const state = addItem(blank(), "descansos", item);
    expect(setItemField(state, "descansos", item.id, "cumplido", true, TODAY).descansos[0].cumplido).toBe(true);
  });

  it("stamps doneAt when an objective becomes Hecho and clears it otherwise", () => {
    const item = createRegistryItem("objetivos", TODAY);
    const state = addItem(blank(), "objetivos", item);
    const done = setItemField(state, "objetivos", item.id, "estado", "Hecho", TODAY);
    expect(done.objetivos[0].doneAt).toBe(TODAY);
    const reopened = setItemField(done, "objetivos", item.id, "estado", "En curso", TODAY);
    expect(reopened.objetivos[0].doneAt).toBe("");
  });

  it("recomputes an objective's deadline when its period changes", () => {
    const item = createRegistryItem("objetivos", TODAY, { periodo: "Semanal", planWeek: "2026-11-02" });
    expect(item.plazo).toBe("2026-11-08");
    const state = addItem(blank(), "objetivos", item);
    const week = setItemField(state, "objetivos", item.id, "semana", "2026-11-09", TODAY);
    expect(week.objetivos[0].plazo).toBe("2026-11-15");
    const monthly = setItemField(state, "objetivos", item.id, "periodo", "Mensual", TODAY);
    expect(monthly.objetivos[0].plazo).toBe("2026-11-30");
    const otherMonth = setItemField(monthly, "objetivos", item.id, "mes", "2026-02", TODAY);
    expect(otherMonth.objetivos[0].plazo).toBe("2026-02-28");
  });

  it("does not touch the deadline when other objective fields change", () => {
    const item = createRegistryItem("objetivos", TODAY);
    const state = addItem(blank(), "objetivos", item);
    const next = setItemField(state, "objetivos", item.id, "objetivo", "Hacer algo", TODAY);
    expect(next.objetivos[0].plazo).toBe(item.plazo);
  });
});

describe("selectOptions", () => {
  it("keeps the options when the current value is one of them or empty", () => {
    expect(selectOptions(["a", "b"], "a")).toEqual(["a", "b"]);
    expect(selectOptions(["a", "b"], "")).toEqual(["a", "b"]);
  });

  it("puts a saved value that is no longer an option first", () => {
    expect(selectOptions(["a", "b"], "z")).toEqual(["z", "a", "b"]);
  });
});
