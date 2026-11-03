"use client";

import { useState, type ReactNode } from "react";
import { MIN_SEMANAL } from "@/features/plan/domain/metrics";
import { RegistryContainer, addRegistryItem } from "@/features/registries/ui/registry-container";
import { useAppStore } from "@/features/state/store/use-app-store";
import { fmtDate, todayIso } from "@/shared/lib/dates";
import { BarRow, Chip, PageHead } from "@/shared/ui/primitives";
import { btnPrimary, panel, row } from "@/shared/ui/styles";
import { weeklyPosts, type WeeklyPosts } from "../domain/weekly";

export interface VisibilityViewProps {
  weekly: WeeklyPosts;
  onAddPost: () => void;
  posts: ReactNode;
  /** The LinkedIn metrics block, present while the "visibilidad" module is on. */
  metrics: { onAdd: () => void; list: ReactNode } | null;
}

export function VisibilityView({ weekly, onAddPost, posts, metrics }: VisibilityViewProps) {
  return (
    <>
      <PageHead
        title="Visibilidad"
        action={
          <button type="button" className={btnPrimary} onClick={onAddPost}>
            + Registrar
          </button>
        }
      >
        Publicaciones y participación en comunidades de LinkedIn. Mínimo definido en tu programa: {MIN_SEMANAL}{" "}
        por semana.
      </PageHead>

      <div className={`${panel} mb-4`}>
        <div className={`${row} justify-between`}>
          <h3 className="text-base font-bold">Esta semana</h3>
          <Chip tone={weekly.current >= MIN_SEMANAL ? "ok" : "neutral"}>
            {weekly.current} de {MIN_SEMANAL}
          </Chip>
        </div>
        <p className="mb-2 mt-0.5 text-xs text-muted">
          Cuenta publicaciones, artículos, comentarios y participaciones en comunidades. Últimas 8 semanas
          (lunes de inicio):
        </p>
        {weekly.weeks.map((w) => (
          <BarRow
            key={w.monday}
            mono
            label={fmtDate(w.monday)}
            pct={(w.count / weekly.max) * 100}
            tone={w.meetsMinimum ? "ok" : "accent"}
            value={w.count}
          />
        ))}
      </div>

      {posts}

      {metrics ? (
        <>
          <div className="mt-[22px]">
            <PageHead
              title="Indicadores de visibilidad"
              action={
                <button type="button" className={btnPrimary} onClick={metrics.onAdd}>
                  + Nueva medición
                </button>
              }
            >
              Copiá los valores desde tu cuenta de LinkedIn. <Chip>Propuesta a validar</Chip>
            </PageHead>
          </div>
          {metrics.list}
        </>
      ) : null}
    </>
  );
}

export function VisibilityTab() {
  const state = useAppStore((s) => s.state);
  const [today] = useState(todayIso);

  return (
    <VisibilityView
      weekly={weeklyPosts(state, today)}
      onAddPost={() => addRegistryItem("posts", today)}
      posts={<RegistryContainer registry="posts" today={today} />}
      metrics={
        state.mods.visibilidad
          ? {
              onAdd: () => addRegistryItem("metricas", today),
              list: <RegistryContainer registry="metricas" today={today} />,
            }
          : null
      }
    />
  );
}
