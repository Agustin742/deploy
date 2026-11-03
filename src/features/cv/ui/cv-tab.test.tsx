// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import { JD_EXAMPLE } from "@/features/matching/domain/example";
import { blank } from "@/features/state/domain/state";
import { appStore } from "@/features/state/store/use-app-store";
import { copyToClipboard } from "@/shared/lib/clipboard";
import { downloadText } from "@/shared/lib/download";
import { extractPdfText } from "../infrastructure/extract-pdf-text";
import { CvTab } from "./cv-tab";

vi.mock("../infrastructure/extract-pdf-text", () => ({ extractPdfText: vi.fn() }));
vi.mock("@/shared/lib/download", () => ({ downloadText: vi.fn() }));
vi.mock("@/shared/lib/clipboard", () => ({ copyToClipboard: vi.fn() }));

const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";
const state = () => appStore.getState().state;
const pdf = () => new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
const upload = (label: string, file: File) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });

function renderTab() {
  const onNotify = vi.fn();
  render(<CvTab onNotify={onNotify} />);
  return { onNotify };
}

describe("CvTab", () => {
  beforeEach(() => {
    window.localStorage.clear();
    appStore.setState(appStore.getInitialState(), true);
    appStore.getState().load();
    vi.mocked(extractPdfText).mockReset();
    vi.mocked(downloadText).mockReset();
    vi.mocked(copyToClipboard).mockReset();
  });
  afterEach(() => {
    appStore.getState().saveNow();
    cleanup();
    vi.restoreAllMocks();
  });

  describe("form", () => {
    it("asks for the CV when there is none and offers both backup actions", () => {
      renderTab();
      expect(screen.getByRole("heading", { level: 2, name: "Mi CV" })).toBeTruthy();
      expect(screen.getByText("Cargá tu CV para activar el match")).toBeTruthy();
      expect(screen.getByText(/cuando pegues tu CV, acá aparecen las skills/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Descargar copia" })).toBeTruthy();
      expect(screen.getByText("Restaurar copia")).toBeTruthy();
    });

    it("takes the name from the pasted CV and lists the recognised skills", () => {
      renderTab();
      fireEvent.change(screen.getByLabelText("Texto del CV"), { target: { value: CV } });
      expect(state().profile.cv).toBe(CV);
      expect((screen.getByLabelText("Nombre (se toma del CV)") as HTMLInputElement).value).toBe("Ana Pérez");
      expect(screen.queryByText("Cargá tu CV para activar el match")).toBeNull();
      const skills = screen.getByText("Skills que el sistema reconoce en tu CV").closest("div")!;
      expect(within(skills).getByText("React")).toBeTruthy();
      expect(screen.getByText("Guardado")).toBeTruthy();
    });

    it("keeps a name typed by hand when the CV changes", () => {
      renderTab();
      fireEvent.change(screen.getByLabelText("Nombre (se toma del CV)"), { target: { value: "Anita" } });
      expect(state().profile.nameAuto).toBe(false);
      fireEvent.change(screen.getByLabelText("Texto del CV"), { target: { value: CV } });
      expect(state().profile.name).toBe("Anita");
    });

    it("saves headline, years, English level, extra skills and the share-name choice", () => {
      renderTab();
      fireEvent.change(screen.getByLabelText("Titular"), { target: { value: "Frontend · React" } });
      fireEvent.change(screen.getByLabelText("Años de experiencia"), { target: { value: "4" } });
      fireEvent.change(screen.getByLabelText("Inglés"), { target: { value: "3" } });
      fireEvent.change(screen.getByLabelText(/Skills adicionales/), { target: { value: "Astro, Three.js" } });
      fireEvent.click(screen.getByLabelText(/Incluir mi nombre/));
      expect(state().profile).toMatchObject({
        headline: "Frontend · React",
        years: "4",
        english: "3",
        extraSkills: "Astro, Three.js",
        shareName: true,
      });
      expect(screen.getByText("Astro")).toBeTruthy();
      expect(JSON.parse(window.localStorage.getItem("radar-postulaciones-v1") ?? "{}").profile.english).toBe("3");
    });
  });

  describe("CV files", () => {
    it("loads a text file", async () => {
      const { onNotify } = renderTab();
      upload("Subir CV (PDF, .txt o .md)", new File([CV], "cv.txt", { type: "text/plain" }));
      await waitFor(() => expect(state().profile.cv).toBe(CV));
      expect(state().profile.name).toBe("Ana Pérez");
      expect(onNotify).toHaveBeenCalledWith("CV cargado");
    });

    it("reads a PDF with pdf.js and loads its text", async () => {
      vi.mocked(extractPdfText).mockResolvedValue(CV);
      const { onNotify } = renderTab();
      upload("Subir CV (PDF, .txt o .md)", pdf());
      expect(onNotify).toHaveBeenCalledWith("Leyendo el PDF…");
      await waitFor(() => expect(state().profile.cv).toBe(CV));
      expect(extractPdfText).toHaveBeenCalledTimes(1);
      expect(state().profile.name).toBe("Ana Pérez");
      expect(onNotify).toHaveBeenLastCalledWith("CV cargado desde el PDF. Revisá que el texto haya quedado bien.");
    });

    it("keeps the current CV when the PDF has no readable text", async () => {
      vi.mocked(extractPdfText).mockResolvedValue("   ");
      appStore.getState().update((s) => ({ ...s, profile: { ...s.profile, cv: CV } }), { immediate: true });
      const { onNotify } = renderTab();
      upload("Subir CV (PDF, .txt o .md)", pdf());
      await waitFor(() =>
        expect(onNotify).toHaveBeenLastCalledWith(
          "No pude leer texto en este PDF (parece una imagen escaneada). Pegá el texto a mano.",
        ),
      );
      expect(state().profile.cv).toBe(CV);
    });

    it("reports a PDF that fails to load", async () => {
      vi.mocked(extractPdfText).mockRejectedValue(new Error("worker"));
      const { onNotify } = renderTab();
      upload("Subir CV (PDF, .txt o .md)", pdf());
      await waitFor(() =>
        expect(onNotify).toHaveBeenLastCalledWith("No se pudo leer el PDF. Probá de nuevo o pegá el texto."),
      );
      expect(state().profile.cv).toBe("");
    });
  });

  describe("recalculation and backup", () => {
    it("recalculates every offer that has a description", () => {
      const withJd = newApp({ id: "a", jd: JD_EXAMPLE }, "2026-11-03");
      appStore.getState().update(
        (s) => ({ ...s, profile: { ...s.profile, cv: CV }, apps: [withJd, newApp({ id: "b" }, "2026-11-03")] }),
        { immediate: true },
      );
      const { onNotify } = renderTab();
      fireEvent.click(screen.getByRole("button", { name: "Recalcular todas las postulaciones" }));
      expect(state().apps[0].match?.pct).toBeGreaterThan(0);
      expect(state().apps[1].match).toBeNull();
      expect(onNotify).toHaveBeenCalledWith("1 postulaciones recalculadas");
    });

    it("restores a backup file", async () => {
      const backup = { ...blank(), apps: [newApp({ id: "z", empresa: "Restaurada" }, "2026-11-03")] };
      const { onNotify } = renderTab();
      upload("Restaurar copia", new File([JSON.stringify(backup)], "copia.json", { type: "application/json" }));
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith("Copia restaurada"));
      expect(state().apps.map((a) => a.empresa)).toEqual(["Restaurada"]);
    });

    it("downloads the whole state as a dated JSON backup", () => {
      appStore.getState().update((s) => ({ ...s, goal: 5, goalSet: true }), { immediate: true });
      vi.mocked(downloadText).mockReturnValue(true);
      const { onNotify } = renderTab();
      fireEvent.click(screen.getByRole("button", { name: "Descargar copia" }));
      const [filename, data, mime] = vi.mocked(downloadText).mock.calls[0];
      expect(filename).toMatch(/^radar-postulaciones-\d{4}-\d{2}-\d{2}\.json$/);
      expect(JSON.parse(data)).toEqual(state());
      expect(mime).toBe("application/json");
      expect(onNotify).toHaveBeenCalledWith("Copia lista");
    });

    it("falls back to the clipboard when the download is not possible", async () => {
      vi.mocked(downloadText).mockReturnValue(false);
      vi.mocked(copyToClipboard).mockResolvedValue(true);
      const { onNotify } = renderTab();
      fireEvent.click(screen.getByRole("button", { name: "Descargar copia" }));
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith("Copia copiada al portapapeles"));
      expect(JSON.parse(vi.mocked(copyToClipboard).mock.calls[0][0])).toEqual(state());
    });

    it("says so when neither the download nor the clipboard work", async () => {
      vi.mocked(downloadText).mockReturnValue(false);
      vi.mocked(copyToClipboard).mockResolvedValue(false);
      const { onNotify } = renderTab();
      fireEvent.click(screen.getByRole("button", { name: "Descargar copia" }));
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith("No se pudo descargar"));
    });

    it("rejects a file that is not a valid backup", async () => {
      const { onNotify } = renderTab();
      upload("Restaurar copia", new File(["{\"hola\":1}"], "x.json", { type: "application/json" }));
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith("El archivo no es una copia válida"));
      expect(state().apps).toEqual([]);
    });
  });
});
