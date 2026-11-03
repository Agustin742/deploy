import { describe, expect, it, vi } from "vitest";
import { isPdf, readCvFile } from "./read-cv-file";

const file = (name: string, type: string, content = "texto del cv") => new File([content], name, { type });
const LONG = "Ana Pérez\n" + "Experiencia en desarrollo frontend con React y TypeScript. ".repeat(3);

describe("isPdf", () => {
  it("recognises PDFs by extension or media type", () => {
    expect(isPdf(file("cv.PDF", ""))).toBe(true);
    expect(isPdf(file("cv", "application/pdf"))).toBe(true);
    expect(isPdf(file("cv.txt", "text/plain"))).toBe(false);
  });
});

describe("readCvFile", () => {
  it("reads plain text files as they are", async () => {
    const extract = vi.fn();
    const r = await readCvFile(file("cv.md", "text/markdown", "# Ana\nhola"), extract);
    expect(r).toEqual({ status: "ok", text: "# Ana\nhola", message: "CV cargado" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("extracts the text of a PDF", async () => {
    const extract = vi.fn().mockResolvedValue(LONG);
    const r = await readCvFile(file("cv.pdf", "application/pdf"), extract);
    expect(r).toEqual({ status: "ok", text: LONG, message: "CV cargado desde el PDF. Revisá que el texto haya quedado bien." });
  });

  it("reports a PDF without readable text (scanned image)", async () => {
    const r = await readCvFile(file("cv.pdf", "application/pdf"), vi.fn().mockResolvedValue("corto"));
    expect(r).toEqual({
      status: "no-text",
      message: "No pude leer texto en este PDF (parece una imagen escaneada). Pegá el texto a mano.",
    });
  });

  it("reports a PDF that cannot be read", async () => {
    const r = await readCvFile(file("cv.pdf", "application/pdf"), vi.fn().mockRejectedValue(new Error("boom")));
    expect(r).toEqual({ status: "error", message: "No se pudo leer el PDF. Probá de nuevo o pegá el texto." });
  });
});
