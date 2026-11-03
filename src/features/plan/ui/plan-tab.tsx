"use client";

import { Fragment, useState } from "react";
import { RegistryContainer, addRegistryItem } from "@/features/registries/ui/registry-container";
import type { ModKey, Objetivo } from "@/features/state/domain/types";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { mondayOf, todayIso } from "@/shared/lib/dates";
import { Notice } from "@/shared/ui/primitives";
import { buildBoard } from "../domain/board";
import { VARS } from "../domain/indicators";
import { objectiveWarnings } from "../domain/objectives";
import { visVars, weekVars } from "../domain/variables";
import { shiftWeek, toggleWeekVar } from "../domain/week-selection";
import { PlanView } from "./plan-view";

const DIRECTION_FIELDS = [
  ["activos", "Mis activos: lo que ya tengo (habilidades, experiencia, red)"],
  ["aspiraciones", "Mis aspiraciones y valores"],
  ["mercado", "Realidades del mercado: lo que se pide y se paga"],
  ["sintesis", "Dónde encajan las tres cosas"],
  ["objetivoLaboral", "Mi objetivo laboral"],
] as const;

const BRAND_FIELDS = [
  ["promesa", "Mi propuesta de valor: qué ofrezco que me distingue"],
  ["audiencia", "A quién me dirijo"],
  ["historia", "Mi historia profesional en pocas líneas"],
  ["titular", "Titular de LinkedIn"],
] as const;

const MAX_VARS_MESSAGE = "Máximo 5 variables por semana. Sacá una para elegir otra.";

function ObjectiveWarnings({ item }: { item: Objetivo }) {
  const warnings = objectiveWarnings(item);
  if (!warnings.length) return null;
  return (
    <div className="mt-3">
      <Notice tone="warn">
        {warnings.map((w, i) => (
          <Fragment key={w}>
            {i > 0 ? <br /> : null}
            {w}
          </Fragment>
        ))}
      </Notice>
    </div>
  );
}

export interface PlanTabProps {
  /** Monday of the week being planned, or null for the current one. */
  planWeek: string | null;
  onPlanWeekChange: (week: string) => void;
  onNavigate: (tab: string) => void;
  onNotify: (message: string) => void;
}

export function PlanTab({ planWeek, onPlanWeekChange, onNavigate, onNotify }: PlanTabProps) {
  const state = useAppStore((s) => s.state);
  const [today] = useState(todayIso);
  const currentWeek = mondayOf(today);
  const week = planWeek || currentWeek;
  const selected = weekVars(state, week);
  const update = appStore.getState().update;

  return (
    <PlanView
      week={week}
      isCurrentWeek={week === currentWeek}
      variables={visVars(state).map((v) => ({ id: v.id, name: v.n, description: v.d }))}
      selected={selected}
      onShiftWeek={(days) => onPlanWeekChange(shiftWeek(week, days))}
      onToggleVariable={(id, checked) => {
        const result = toggleWeekVar(appStore.getState().state, week, id, checked);
        if (!result.ok) {
          onNotify(MAX_VARS_MESSAGE);
          return;
        }
        update(() => result.state, { immediate: true });
      }}
      weeklyObjectives={
        <RegistryContainer
          registry="objetivos"
          today={today}
          filter={(o) => o.periodo !== "Mensual"}
          empty={["Sin objetivos semanales", "Escribí uno con “+ Objetivo semanal”."]}
          renderExtra={(o) => <ObjectiveWarnings item={o} />}
        />
      }
      monthlyObjectives={
        <RegistryContainer
          registry="objetivos"
          today={today}
          filter={(o) => o.periodo === "Mensual"}
          empty={["Sin objetivos mensuales", "Escribí uno con “+ Objetivo mensual”."]}
          renderExtra={(o) => <ObjectiveWarnings item={o} />}
        />
      }
      onAddObjective={(periodo) => addRegistryItem("objetivos", today, { periodo, planWeek })}
      board={buildBoard(state, selected, today)}
      metas={state.metas}
      onMeta={(key, value) => update((s) => ({ ...s, metas: { ...s.metas, [key]: value } }))}
      onGo={onNavigate}
      modules={VARS.filter((v) => v.mod).map((v) => ({
        mod: v.mod as ModKey,
        name: v.n,
        description: v.d ?? "",
        enabled: state.mods[v.mod as ModKey],
      }))}
      onToggleModule={(mod, enabled) =>
        update((s) => ({ ...s, mods: { ...s.mods, [mod]: enabled } }), { immediate: true })
      }
      direction={
        state.mods.valores
          ? DIRECTION_FIELDS.map(([key, label]) => ({ key, label, value: state.base[key] }))
          : null
      }
      onDirection={(key, value) => update((s) => ({ ...s, base: { ...s.base, [key]: value } }))}
      brand={
        state.mods.marca
          ? BRAND_FIELDS.map(([key, label]) => ({ key, label, value: state.marca[key] }))
          : null
      }
      onBrand={(key, value) => update((s) => ({ ...s, marca: { ...s.marca, [key]: value } }))}
    />
  );
}
