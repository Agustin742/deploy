/** The slice of a pdf.js text item that matters here. */
export interface PdfTextItem {
  str: string;
  /** Transform matrix; index 5 is the baseline's vertical position. */
  transform?: number[];
  hasEOL?: boolean;
}

export const MAX_PDF_PAGES = 15;

/** Vertical distance, in PDF units, from which two items count as different lines. */
const LINE_TOLERANCE = 2;

/**
 * Rebuilds plain text from the text items of each page: lines break when the baseline
 * moves or the item ends a line, pages are separated by a blank line.
 */
export function assemblePdfText(pages: readonly (readonly PdfTextItem[])[]): string {
  let out = "";
  for (const items of pages.slice(0, MAX_PDF_PAGES)) {
    let lastY: number | null = null;
    let line = "";
    for (const it of items) {
      const y = it.transform ? it.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > LINE_TOLERANCE) {
        out += line.trim() + "\n";
        line = "";
      }
      line += it.str;
      if (it.hasEOL) {
        out += line.trim() + "\n";
        line = "";
      }
      if (y !== null) lastY = y;
    }
    out += line.trim() + "\n\n";
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
