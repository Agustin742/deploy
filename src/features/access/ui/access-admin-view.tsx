import { EmptyState, Notice } from "@/shared/ui/primitives";
import { btnDanger, btnPrimary, btnSmall, fieldLabel, input, item, panel, row, smallMuted } from "@/shared/ui/styles";
import type { AdminError, AllowedEmailView } from "../domain/allowed-email-view";

export interface AccessAdminViewProps {
  owners: string[];
  emails: AllowedEmailView[];
  draft: string;
  busy: boolean;
  error: AdminError | null;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (email: string) => void;
}

const ERROR_COPY: Record<AdminError, string> = {
  forbidden: "No tenés permiso para administrar accesos.",
  invalid_email: "Ese email no parece válido. Revisalo e intentá de nuevo.",
  failed: "No pudimos completar la acción. Intentá de nuevo.",
};

export function AccessAdminView({ owners, emails, draft, busy, error, onDraftChange, onAdd, onRemove }: AccessAdminViewProps) {
  return (
    <div className="mx-auto max-w-[720px] pt-6">
      <h1 className="text-2xl font-extrabold">Accesos</h1>
      <p className="mb-4 mt-1 text-muted">Solo los emails de esta lista (y los administradores) pueden ingresar a la app.</p>

      <section className={`${panel} mb-4`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
          className="flex flex-col gap-3"
        >
          <label className={fieldLabel}>
            Dar acceso a un email
            <input
              type="email"
              name="email"
              autoComplete="off"
              required
              placeholder="persona@ejemplo.com"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              className={input}
            />
          </label>
          {error ? (
            <div role="alert">
              <Notice tone="warn">{ERROR_COPY[error]}</Notice>
            </div>
          ) : null}
          <div>
            <button type="submit" className={btnPrimary} disabled={busy}>
              Dar acceso
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Emails con acceso">
        <h2 className="mb-2 text-lg font-extrabold">Con acceso ({emails.length})</h2>
        {emails.length === 0 ? (
          <EmptyState title="Todavía no hay emails">Agregá el primero con el formulario de arriba.</EmptyState>
        ) : (
          <ul className="m-0 list-none p-0">
            {emails.map((entry) => (
              <li key={entry.email} className={`${item} ${row} justify-between`}>
                <div className="min-w-0">
                  <b className="break-all">{entry.email}</b>
                  <div className={smallMuted}>
                    Desde {entry.createdAt.slice(0, 10)}
                    {entry.addedBy ? ` · agregado por ${entry.addedBy}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className={`${btnDanger} ${btnSmall}`}
                  disabled={busy}
                  aria-label={`Quitar acceso a ${entry.email}`}
                  onClick={() => onRemove(entry.email)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6" aria-label="Administradores">
        <h2 className="mb-1 text-lg font-extrabold">Administradores</h2>
        <p className={smallMuted}>Siempre tienen acceso. Se definen en la configuración del servidor.</p>
        <ul className="mt-2 list-none p-0 text-sm">
          {owners.map((owner) => (
            <li key={owner} className="break-all">
              {owner}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
