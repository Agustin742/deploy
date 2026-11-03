import { describe, expect, it } from "vitest";
import { parseReport } from "./report-markdown";

describe("parseReport", () => {
  it("turns headings of any level into headings", () => {
    expect(parseReport("### FODA\n# Otro")).toEqual([
      { type: "heading", inline: [{ text: "FODA" }] },
      { type: "heading", inline: [{ text: "Otro" }] },
    ]);
  });

  it("groups consecutive bullets and numbered items into lists", () => {
    const blocks = parseReport("- uno\n* dos\n\n1. tres\n2) cuatro");
    expect(blocks).toEqual([
      { type: "ul", items: [[{ text: "uno" }], [{ text: "dos" }]] },
      { type: "ol", items: [[{ text: "tres" }], [{ text: "cuatro" }]] },
    ]);
  });

  it("parses bold and italic inline", () => {
    expect(parseReport("Hola **mundo** y *vos*")).toEqual([
      {
        type: "p",
        inline: [{ text: "Hola " }, { text: "mundo", bold: true }, { text: " y " }, { text: "vos", italic: true }],
      },
    ]);
  });

  it("keeps markup characters as plain text and ignores rules and blank lines", () => {
    expect(parseReport("<b>x</b>\n---\n\n2 * 3 * 4")).toEqual([
      { type: "p", inline: [{ text: "<b>x</b>" }] },
      { type: "p", inline: [{ text: "2 * 3 * 4" }] },
    ]);
  });

  it("returns nothing for an empty report", () => {
    expect(parseReport("")).toEqual([]);
  });
});
