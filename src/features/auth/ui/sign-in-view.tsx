import { NO_ACCESS_MESSAGE } from "@/features/access/domain/access-error";
import { Notice } from "@/shared/ui/primitives";
import { btn, btnPrimary, fieldLabel, input, panel, smallMuted } from "@/shared/ui/styles";

export type SignInStatus = "idle" | "sending" | "sent" | "error" | "noAccess";

export interface SignInViewProps {
  email: string;
  status: SignInStatus;
  googleEnabled: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onGoogle: () => void;
}

export function SignInView({ email, status, googleEnabled, onEmailChange, onSubmit, onGoogle }: SignInViewProps) {
  return (
    <div className="mx-auto max-w-[420px] pt-16">
      <b className="font-display text-[21px] font-extrabold tracking-tight">Deploy your Career</b>
      <section className={`${panel} mt-4`}>
        <h1 className="text-2xl font-extrabold">Ingresar</h1>
        <p className="mb-4 mt-1 text-muted">Entrá con tu email o con Google. No hay contraseñas.</p>

        {status === "sent" ? (
          <div role="status">
            <Notice tone="info">
              Te enviamos un link a <b>{email}</b>. Abrilo desde este dispositivo para entrar; vence en unos minutos.
            </Notice>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex flex-col gap-3"
          >
            <label className={fieldLabel}>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className={input}
              />
            </label>
            {status === "error" ? (
              <div role="alert">
                <Notice tone="warn">No pudimos enviar el link. Revisá el email e intentá de nuevo.</Notice>
              </div>
            ) : null}
            {status === "noAccess" ? (
              <div role="alert">
                <Notice tone="warn">{NO_ACCESS_MESSAGE}</Notice>
              </div>
            ) : null}
            <button type="submit" className={btnPrimary} disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Enviarme un link"}
            </button>
          </form>
        )}

        <div className="mt-4 border-t border-line pt-4">
          {googleEnabled ? (
            <button type="button" className={`${btn} w-full`} onClick={onGoogle}>
              Continuar con Google
            </button>
          ) : (
            <p className={smallMuted}>Google todavía no está disponible. Por ahora entrá con el link por email.</p>
          )}
        </div>
      </section>
    </div>
  );
}
