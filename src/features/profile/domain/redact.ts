/** Hides emails and phone numbers before a CV leaves the app (e.g. inside a prompt). */
export const redact = (text: string | null | undefined): string =>
  String(text || "")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email omitido]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, (m) =>
      (m.match(/\d/g) || []).length >= 9 ? "[número omitido]" : m,
    );
