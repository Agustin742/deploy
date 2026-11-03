import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { buildBoard } from "./board";

const TODAY = "2026-11-03";

describe("buildBoard", () => {
  it("returns the selected variables in program order, with activity rows before result rows", () => {
    const board = buildBoard(blank(), ["postulaciones", "networking"], TODAY);
    expect(board.map((b) => b.id)).toEqual(["networking", "postulaciones"]);
    const kinds = board[0].rows.map((r) => r.kind);
    expect(kinds).toEqual(["act", "act", "res", "res", "res"]);
  });

  it("builds the legacy keys used to store personal goals", () => {
    const board = buildBoard(blank(), ["networking"], TODAY);
    expect(board[0].rows.map((r) => r.key)).toEqual([
      "networking:a0",
      "networking:a1",
      "networking:r0",
      "networking:r1",
      "networking:r2",
    ]);
  });

  it("computes the values from the state", () => {
    const state: AppState = {
      ...blank(),
      red: [{ id: "a", fecha: "2026-11-02", conexiones: "150", paginas: "", nota: "" }],
    };
    const rows = buildBoard(state, ["networking"], TODAY)[0].rows;
    expect(rows[0]).toMatchObject({ label: "Registros de la red cargados", value: "1" });
    expect(rows[1].value).toBe("Sí");
    expect(rows[2].value).toBe("150");
    expect(rows[3].value).toBe("—");
  });

  it("carries fixed goals and marks proposals", () => {
    const state: AppState = { ...blank(), mods: { ...blank().mods, marca: true } };
    const board = buildBoard(state, ["comunidades", "marca"], TODAY);
    expect(board.find((b) => b.id === "comunidades")?.rows[0].fixedGoal).toBe(
      "mín. 3 por semana (definido en tu programa)",
    );
    expect(board.find((b) => b.id === "comunidades")?.proposal).toBe(false);
    expect(board.find((b) => b.id === "marca")?.proposal).toBe(true);
  });

  it("skips variables whose module is off", () => {
    expect(buildBoard(blank(), ["marca"], TODAY)).toEqual([]);
  });
});
