"use client";

import { useState } from "react";
import { RegistryContainer, addRegistryItem } from "@/features/registries/ui/registry-container";
import { todayIso } from "@/shared/lib/dates";
import { Chip, PageHead } from "@/shared/ui/primitives";
import { btnPrimary } from "@/shared/ui/styles";

export function ExperimentsTab() {
  const [today] = useState(todayIso);

  return (
    <>
      <PageHead
        title="Experimentos de rol"
        action={
          <button type="button" className={btnPrimary} onClick={() => addRegistryItem("experimentos", today)}>
            + Nuevo experimento
          </button>
        }
      >
        Solo si estás considerando un cambio de carrera. <Chip>Propuesta a validar</Chip>
      </PageHead>
      <RegistryContainer registry="experimentos" today={today} />
    </>
  );
}
