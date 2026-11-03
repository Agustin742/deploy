import { describe, expect, it } from "vitest";
import { assemblePdfText, MAX_PDF_PAGES, type PdfTextItem } from "./pdf-text";

const item = (str: string, y: number | null, hasEOL = false): PdfTextItem => ({
  str,
  transform: y === null ? undefined : [1, 0, 0, 1, 0, y],
  hasEOL,
});

describe("assemblePdfText", () => {
  it("joins items on the same baseline into one line and breaks lines when the baseline moves", () => {
    const text = assemblePdfText([[item("Ana ", 700), item("Pérez", 700), item("Frontend", 680), item(" Developer", 680)]]);
    expect(text).toBe("Ana Pérez\nFrontend Developer");
  });

  it("tolerates baseline jitter up to 2 units", () => {
    expect(assemblePdfText([[item("a", 700), item("b", 701.5)]])).toBe("ab");
  });

  it("breaks the line on explicit end-of-line markers", () => {
    expect(assemblePdfText([[item("uno", 700, true), item("dos", 700)]])).toBe("uno\ndos");
  });

  it("separates pages with a blank line", () => {
    expect(assemblePdfText([[item("p1", 700)], [item("p2", 700)]])).toBe("p1\n\np2");
  });

  it("handles items without a transform", () => {
    expect(assemblePdfText([[item("a", null), item("b", null)]])).toBe("ab");
  });

  it("trims trailing spaces and collapses three or more newlines", () => {
    expect(assemblePdfText([[item("a   ", 700, true), item("", 700, true), item("", 700, true), item("b", 700)]])).toBe("a\n\nb");
  });

  it("reads at most 15 pages", () => {
    const pages = Array.from({ length: 20 }, (_, i) => [item(`p${i + 1}`, 700)]);
    const text = assemblePdfText(pages);
    expect(MAX_PDF_PAGES).toBe(15);
    expect(text).toContain("p15");
    expect(text).not.toContain("p16");
  });

  it("returns an empty string for no text", () => {
    expect(assemblePdfText([])).toBe("");
  });
});
