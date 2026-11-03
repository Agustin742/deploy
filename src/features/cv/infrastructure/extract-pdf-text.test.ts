import { beforeEach, describe, expect, it, vi } from "vitest";

const getPage = vi.fn();
const getDocument = vi.fn();
const options: { workerSrc: string } = { workerSrc: "" };
const loaded = vi.fn();

vi.mock("pdfjs-dist", () => {
  loaded();
  return { GlobalWorkerOptions: options, getDocument };
});

const textItem = (str: string, y: number) => ({ str, transform: [1, 0, 0, 1, 0, y], hasEOL: false });

const pdfFile = () => new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });

describe("extractPdfText", () => {
  beforeEach(() => {
    vi.resetModules();
    getPage.mockReset();
    getDocument.mockReset();
    loaded.mockClear();
    options.workerSrc = "";
  });

  it("does not load pdf.js until a PDF is read", async () => {
    await import("./extract-pdf-text");
    expect(loaded).not.toHaveBeenCalled();
  });

  it("configures the worker once and rebuilds the text of each page", async () => {
    const pages = [
      { getTextContent: async () => ({ items: [textItem("Ana ", 700), textItem("Pérez", 700), { type: "beginMarkedContent" }, textItem("React", 680)] }) },
      { getTextContent: async () => ({ items: [textItem("Docker", 700)] }) },
    ];
    getPage.mockImplementation(async (n: number) => pages[n - 1]);
    getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage }) });

    const { extractPdfText } = await import("./extract-pdf-text");
    const text = await extractPdfText(pdfFile());

    expect(text).toBe("Ana Pérez\nReact\n\nDocker");
    expect(options.workerSrc).toMatch(/pdf\.worker/);
    const worker = options.workerSrc;
    await extractPdfText(pdfFile());
    expect(options.workerSrc).toBe(worker);
    expect(getDocument).toHaveBeenCalledWith({ data: expect.any(ArrayBuffer) });
  });

  it("reads at most 15 pages", async () => {
    getPage.mockResolvedValue({ getTextContent: async () => ({ items: [textItem("x", 700)] }) });
    getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 40, getPage }) });
    const { extractPdfText } = await import("./extract-pdf-text");
    await extractPdfText(pdfFile());
    expect(getPage).toHaveBeenCalledTimes(15);
  });
});
