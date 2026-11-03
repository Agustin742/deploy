"use client";

import { useEffect, useRef, useState } from "react";
import { recalcAll } from "@/features/applications/domain/edit";
import { hasCv } from "@/features/matching/domain/engine";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { recognizedSkills } from "../domain/cv-skills";
import { parseBackupText, setCvText, setProfileField } from "../domain/profile-edit";
import { isPdf, readCvFile, READING_PDF_MESSAGE } from "../domain/read-cv-file";
import { extractPdfText } from "../infrastructure/extract-pdf-text";
import { CvView } from "./cv-view";

const SAVED_FLASH_MS = 1500;

export function CvTab({ onNotify }: { onNotify: (message: string) => void }) {
  const profile = useAppStore((s) => s.state.profile);
  const [today] = useState(todayIso);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const flashSaved = () => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), SAVED_FLASH_MS);
  };

  return (
    <CvView
      profile={profile}
      hasCv={hasCv(profile)}
      skills={recognizedSkills(profile)}
      saved={saved}
      onField={(key, value, immediate) => {
        appStore.getState().update((s) => setProfileField(s, key, value), { immediate });
        flashSaved();
      }}
      onCvFile={async (file) => {
        if (isPdf(file)) onNotify(READING_PDF_MESSAGE);
        const result = await readCvFile(file, extractPdfText);
        if (result.status === "ok") appStore.getState().update((s) => setCvText(s, result.text), { immediate: true });
        onNotify(result.message);
      }}
      onRecalcAll={() => {
        const { state, count } = recalcAll(appStore.getState().state, today);
        appStore.getState().update(() => state, { immediate: true });
        onNotify(`${count} postulaciones recalculadas`);
      }}
      onRestoreFile={async (file) => {
        const restored = appStore.getState().importBackup(parseBackupText(await file.text()));
        onNotify(restored ? "Copia restaurada" : "El archivo no es una copia válida");
      }}
    />
  );
}
