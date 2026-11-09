import type { ChangeEvent } from "react";
import { ENG_TXT } from "@/features/matching/domain/engine";
import type { Profile } from "@/features/state/domain/types";
import { Chip, EmptyState, PageHead } from "@/shared/ui/primitives";
import { btn, btnPrimary, fieldLabel, fieldsGrid, gridTwo, input, panel, row } from "@/shared/ui/styles";
import type { RecognizedSkills } from "../domain/cv-skills";

export interface CvViewProps {
  profile: Profile;
  hasCv: boolean;
  skills: RecognizedSkills;
  /** Briefly true after an edit, to show "Guardado". */
  saved: boolean;
  /** `immediate` is true for selects and checkboxes, which save right away. */
  onField: <K extends keyof Profile>(key: K, value: Profile[K], immediate: boolean) => void;
  onCvFile: (file: File) => void;
  onRecalcAll: () => void;
  onRestoreFile: (file: File) => void;
  onDownloadBackup: () => void;
}

/** File picker styled as a button; the input stays focusable for keyboard users. */
function FileButton({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File) => void }) {
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  };
  return (
    <label className={`${btn} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}>
      {label}
      <input type="file" accept={accept} className="sr-only" onChange={pick} />
    </label>
  );
}

export function CvView({
  profile: p,
  hasCv,
  skills,
  saved,
  onField,
  onCvFile,
  onRecalcAll,
  onRestoreFile,
  onDownloadBackup,
}: CvViewProps) {
  return (
    <>
      <PageHead title="Mi CV">
        El match se calcula contra este texto. Se guarda solo mientras escribís.{" "}
        <span aria-live="polite" className="font-mono text-xs font-medium text-ok">
          {saved ? "Guardado" : ""}
        </span>
      </PageHead>
      {hasCv ? null : (
        <div className="mb-4">
          <EmptyState title="Cargá tu CV para activar el match">Subí tu CV en PDF o pegá el texto completo.</EmptyState>
        </div>
      )}
      <div className={gridTwo}>
        <div className={panel}>
          <div className={fieldsGrid}>
            <label className={fieldLabel}>
              Nombre (se toma del CV)
              <input className={input} value={p.name} placeholder="Aparece solo al pegar tu CV" onChange={(e) => onField("name", e.target.value, false)} />
            </label>
            <label className={fieldLabel}>
              Titular
              <input className={input} value={p.headline} placeholder="Ej. Frontend Developer · React" onChange={(e) => onField("headline", e.target.value, false)} />
            </label>
            <label className={fieldLabel}>
              Años de experiencia
              <input
                className={input}
                type="number"
                min={0}
                max={40}
                value={p.years}
                placeholder="Ej. 3"
                onChange={(e) => onField("years", e.target.value, false)}
              />
            </label>
            <label className={fieldLabel}>
              Inglés
              <select className={input} value={String(p.english)} onChange={(e) => onField("english", e.target.value, true)}>
                <option value="">Detectar del CV</option>
                {[1, 2, 3].map((i) => (
                  <option key={i} value={String(i)}>
                    {ENG_TXT[i]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={`${fieldLabel} mt-3`}>
            Skills adicionales (separadas por coma)
            <input
              className={input}
              value={p.extraSkills}
              placeholder="Ej. Astro, Three.js, Accesibilidad"
              onChange={(e) => onField("extraSkills", e.target.value, false)}
            />
          </label>
          <label className={`${fieldLabel} mt-3 justify-end`}>
            <span className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={p.shareName} onChange={(e) => onField("shareName", e.target.checked, true)} /> Incluir mi nombre cuando
              comparto datos con una IA (por defecto no)
            </span>
          </label>
          <label className={`${fieldLabel} mt-3`}>
            Texto del CV
            <textarea
              className={`${input} resize-y leading-normal`}
              rows={22}
              value={p.cv}
              placeholder="Pegá tu CV: experiencia, educación, proyectos, herramientas, idiomas…"
              onChange={(e) => onField("cv", e.target.value, false)}
            />
          </label>
          <div className={`${row} mt-3`}>
            <FileButton label="Subir CV (PDF, .txt o .md)" accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown" onFile={onCvFile} />
            <button type="button" className={btnPrimary} onClick={onRecalcAll}>
              Recalcular todas las postulaciones
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            El PDF se lee en tu navegador y solo se guarda el texto: el archivo no se sube a ningún servidor. Funciona con PDF con texto seleccionable (no con
            imágenes escaneadas). Si tu CV está en Word, copiá el texto y pegalo acá. Cuando generás un informe con IA se te avisa qué datos se comparten; los
            emails y teléfonos del CV se omiten.
          </p>
        </div>
        <div className="grid content-start gap-4">
          <div className={panel}>
            <h3 className="mb-2 text-base font-bold">Skills que el sistema reconoce en tu CV</h3>
            <div>
              {skills.found.length || skills.extra.length ? (
                <>
                  {skills.found.map((s) => (
                    <Chip key={s.n} tone={s.k === "h" ? "info" : "neutral"}>
                      {s.n}
                    </Chip>
                  ))}
                  {skills.extra.map((s, i) => (
                    <Chip key={`${s}-${i}`} tone="info">
                      {s}
                    </Chip>
                  ))}
                </>
              ) : (
                <p className="text-xs text-muted">Cuando pegues tu CV, acá aparecen las skills que se usan para el cálculo.</p>
              )}
            </div>
          </div>
          <div className={panel}>
            <h3 className="mb-1.5 text-base font-bold">Copia de seguridad</h3>
            <p className="mb-2.5 text-xs text-muted">
              Tus datos se guardan en tu cuenta. La copia incluye todo lo que cargaste (CV, registro de la red y objetivos): guardala en un lugar privado.
            </p>
            <div className={row}>
              <button type="button" className={btn} onClick={onDownloadBackup}>
                Descargar copia
              </button>
              <FileButton label="Restaurar copia" accept=".json,application/json" onFile={onRestoreFile} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
