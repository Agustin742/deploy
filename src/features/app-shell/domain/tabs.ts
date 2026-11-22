import type { Mods, Profile } from "@/features/state/domain/types";

export type TabId =
  | "resumen"
  | "plan"
  | "postulaciones"
  | "nueva"
  | "red"
  | "visibilidad"
  | "empleadores"
  | "experimentos"
  | "analisis"
  | "cv"
  | "busqueda";

export interface TabDef {
  id: TabId;
  label: string;
}

export const DEFAULT_TAB: TabId = "resumen";

/** Tab shown when the current one is no longer available (the legacy fallback). */
export const FALLBACK_TAB: TabId = "resumen";

/**
 * Every tab of the app, in legacy order. Empleadores and Experimentos only exist while their module is on.
 * The navigation itself is split by `primaryTabs` and `moreTabs`.
 */
export function visibleTabs(mods: Mods): TabDef[] {
  const tabs: TabDef[] = [
    { id: "resumen", label: "Resumen" },
    { id: "plan", label: "Plan" },
    { id: "postulaciones", label: "Postulaciones" },
    { id: "nueva", label: "Nueva oferta" },
    { id: "red", label: "Red" },
    { id: "visibilidad", label: "Visibilidad" },
  ];
  if (mods.empleadores) tabs.push({ id: "empleadores", label: "Empleadores" });
  if (mods.experimentos) tabs.push({ id: "experimentos", label: "Experimentos" });
  tabs.push(
    { id: "analisis", label: "Análisis" },
    { id: "cv", label: "Mi CV" },
    { id: "busqueda", label: "Búsqueda diaria" },
  );
  return tabs;
}

/** Tabs always shown in the main navigation, in order. */
export const PRIMARY_TAB_IDS: readonly TabId[] = ["resumen", "postulaciones", "analisis", "plan", "cv"];

/** Tabs of the main navigation (desktop bar). */
export function primaryTabs(mods: Mods): TabDef[] {
  const all = visibleTabs(mods);
  return PRIMARY_TAB_IDS.flatMap((id) => all.find((t) => t.id === id) ?? []);
}

/**
 * Tabs behind the "Más" menu: everything that is neither primary nor the "Nueva oferta" view,
 * which is reached from the global "Cargar postulación" action.
 */
export function moreTabs(mods: Mods): TabDef[] {
  const order: TabId[] = ["red", "visibilidad", "busqueda", "empleadores", "experimentos"];
  const all = visibleTabs(mods);
  return order.flatMap((id) => all.find((t) => t.id === id) ?? []);
}

/** Tabs of the mobile bottom bar; the rest go to its "Más" sheet. */
export const MOBILE_TAB_IDS: readonly TabId[] = ["resumen", "postulaciones", "analisis"];

/** Everything the mobile "Más" sheet lists: the remaining primary tabs, then the "Más" tabs. */
export function mobileMoreTabs(mods: Mods): TabDef[] {
  const rest = primaryTabs(mods).filter((t) => !MOBILE_TAB_IDS.includes(t.id));
  return [...rest, ...moreTabs(mods)];
}

const ALL_MODS_ON: Mods = {
  valores: true,
  marca: true,
  empleadores: true,
  seguimiento: true,
  informativas: true,
  experimentos: true,
  visibilidad: true,
  ia: true,
};

export const isTabId = (value: string): value is TabId =>
  visibleTabs(ALL_MODS_ON).some((t) => t.id === value);

export const resolveTab = (tab: TabId, mods: Mods): TabId =>
  visibleTabs(mods).some((t) => t.id === tab) ? tab : FALLBACK_TAB;

/** Subtitle of the brand: the person's name (or a hint to load the CV) and headline. */
export const whoLine = (profile: Pick<Profile, "name" | "headline">): string =>
  [profile.name || "Cargá tu CV para ver tu nombre", profile.headline].filter(Boolean).join(" · ");

/** Up to two initials of a person's name, or an empty string when the name is unknown. */
export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
