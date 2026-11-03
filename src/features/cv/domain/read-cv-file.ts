import { hasCv } from "@/features/matching/domain/engine";

export type ReadCvResult =
  | { status: "ok"; text: string; message: string }
  | { status: "no-text" | "error"; message: string };

export type ExtractPdfText = (file: File) => Promise<string>;

export const isPdf = (file: Pick<File, "name" | "type">): boolean =>
  /\.pdf$/i.test(file.name) || file.type === "application/pdf";

/**
 * Turns an uploaded CV file into text. PDFs go through `extractPdfText` (injected so the
 * heavy pdf.js bundle is only loaded when a PDF is chosen); other files are read as text.
 */
export async function readCvFile(file: File, extractPdfText: ExtractPdfText): Promise<ReadCvResult> {
  if (!isPdf(file)) return { status: "ok", text: await file.text(), message: "CV cargado" };
  try {
    const text = await extractPdfText(file);
    if (!hasCv({ cv: text })) {
      return {
        status: "no-text",
        message: "No pude leer texto en este PDF (parece una imagen escaneada). Pegá el texto a mano.",
      };
    }
    return { status: "ok", text, message: "CV cargado desde el PDF. Revisá que el texto haya quedado bien." };
  } catch {
    return { status: "error", message: "No se pudo leer el PDF. Probá de nuevo o pegá el texto." };
  }
}

export const READING_PDF_MESSAGE = "Leyendo el PDF…";
