/**
 * Tailwind class bundles shared by the app views. The visual rules live in `globals.css`
 * (`.btn`, `.field-input`, `.card-*`); these strings are the legacy-friendly handles.
 * Prefer the `Button`, `Select` and `Card` components for new code.
 */

export type ButtonVariant = "primary" | "cta" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  cta: "btn-cta",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClass: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

/** Class string of a button with the given variant and size (also usable on links). */
export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md"): string {
  return ["btn", variantClass[variant], sizeClass[size]].filter(Boolean).join(" ");
}

export const btn = buttonClass("secondary");
export const btnPrimary = buttonClass("primary");
export const btnCta = buttonClass("cta");
export const btnGhost = buttonClass("ghost");
export const btnDanger = buttonClass("danger");
export const btnGhostDanger = "btn btn-ghost-danger";
/** Combine with a variant: `${btn} ${btnSmall}`. Sizing is a CSS class, no `!important`. */
export const btnSmall = "btn-sm";

export const input = "field-input";

export const panel = "card card-standard";
export const cardHero = "card card-hero";
export const cardQuiet = "card card-quiet";
export const item = "mb-3 rounded-card border border-line bg-surface p-3.5";
export const fieldLabel = "flex min-w-0 flex-col gap-1 text-small font-medium text-muted";
export const fieldsGrid = "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]";
export const gridTwo = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))]";
export const kpiGrid = "grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]";
export const row = "flex flex-wrap items-center gap-2";
export const smallMuted = "text-small text-muted";
export const modRow = "flex cursor-pointer items-start gap-2.5 border-t border-line py-[9px]";
