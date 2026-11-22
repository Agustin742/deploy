export const DISCLAIMER =
  "Este radar organiza tu búsqueda y no garantiza empleo ni resultados. La IA sugiere; la decisión final es tuya. Tus datos se guardan en tu cuenta.";

/** Disclaimer footer of the app. */
export function SiteFooter() {
  return (
    <footer className="mt-10 max-w-[760px] border-t border-line pt-4 text-small text-muted">{DISCLAIMER}</footer>
  );
}
