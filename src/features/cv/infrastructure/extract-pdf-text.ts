import { assemblePdfText, MAX_PDF_PAGES, type PdfTextItem } from "../domain/pdf-text";

/** pdf.js mixes text items with marked-content markers; only the former carry text. */
const isTextItem = <T extends object>(item: T): item is Extract<T, { str: string }> => "str" in item;

/**
 * Extracts the text of a PDF in the browser. pdf.js is imported on demand, so it only
 * downloads when someone uploads a PDF and never runs on the server.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // The bundler emits the worker as a static asset and rewrites this URL.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  }
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: PdfTextItem[][] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, MAX_PDF_PAGES); i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.filter(isTextItem));
  }
  return assemblePdfText(pages);
}
