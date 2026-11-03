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
export const FALLBACK_TAB: TabId = "plan";

/** Tabs of the app, in order. Empleadores and Experimentos only exist while their module is on. */
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

export const resolveTab =(tab: TabId, mods: Mods): TabId =>
  visibleTabs(mods).some((t) => t.id === tab) ? tab : FALLBACK_TAB;

/** Subtitle of the brand: the person's name (or a hint to load the CV) and headline. */
export const whoLine = (profile: Pick<Profile, "name" | "headline">): string =>
  [profile.name || "Cargá tu CV para ver tu nombre", profile.headline].filter(Boolean).join(" · ");

/** Counter shown next to a tab label: the number of applications, once there is at least one. */
export const tabCount = (id: TabId, appCount: number): number | null =>
  id === "postulaciones" && appCount > 0 ? appCount : null;
