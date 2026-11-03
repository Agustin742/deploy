"use client";

import { useState } from "react";
import { RegistryContainer, addRegistryItem } from "@/features/registries/ui/registry-container";
import { todayIso } from "@/shared/lib/dates";
import { Chip, PageHead } from "@/shared/ui/primitives";
import { btnPrimary } from "@/shared/ui/styles";

export function EmployersTab() {
  const [today] = useState(todayIso);

  return (
    <>
      <PageHead
        title="Empleadores objetivo"
        action={
          <button type="button" className={btnPrimary} onClick={() => addRegistryItem("empleadores", today)}>
            + Agregar empresa
          </button>
        }
      >
        Lista finita y priorizada. <Chip>Propuesta a validar</Chip>
      </PageHead>
      <RegistryContainer registry="empleadores" today={today} />
    </>
  );
}
