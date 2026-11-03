/** Tailwind class bundles shared by the app views (the legacy `.btn`, `.in`, `.panel`... rules). */

const btnBase =
  "cursor-pointer rounded-lg border px-3.5 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50";

export const btn = `${btnBase} border-line bg-surface hover:border-muted`;
export const btnPrimary = `${btnBase} border-accent bg-accent font-semibold text-accent-ink hover:brightness-110`;
export const btnGhost = `${btnBase} border-transparent bg-transparent text-muted`;
export const btnDanger = `${btnBase} border-line bg-surface text-bad hover:border-muted`;
export const btnGhostDanger = `${btnBase} border-transparent bg-transparent text-bad`;
export const btnSmall = "!px-2.5 !py-[3px] text-xs";

export const input =
  "w-full min-w-0 rounded-lg border border-line bg-bg px-2.5 py-2 text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20";

export const panel = "rounded-xl border border-line bg-surface p-[18px]";
export const item = "mb-3 rounded-xl border border-line bg-surface p-3.5";
export const fieldLabel = "flex min-w-0 flex-col gap-1 text-xs font-medium text-muted";
export const fieldsGrid = "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]";
export const gridTwo = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))]";
export const kpiGrid = "grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]";
export const row = "flex flex-wrap items-center gap-2";
export const smallMuted = "text-xs text-muted";
export const modRow = "flex cursor-pointer items-start gap-2.5 border-t border-line py-[9px]";
