# Feature: Access allowlist + Next security upgrade

## Objective
Only people whose email the client (owner) has pre-loaded can sign in to `/app`. The landing page stays public. Also upgrade Next.js to a patched version (dev server reports a known security vulnerability in 16.4.3).

## Problem / Why
Today anyone can sign in (Google or magic link) and an account is created automatically (`src/features/auth/infrastructure/create-auth.ts`). The client sells access (manual bank transfer, she enables paying users), so access must be invite-only.

## Decisions (with the user, 2026-11-21)
- Model A: **pre-loaded email list**. A person not on the list cannot sign in and sees a "no access" message. No pending/approval queue.
- Landing (`/`) and public pages stay accessible to everyone; only `/app` and the admin area require a session.
- Owner identification: `OWNER_EMAILS` env var (comma-separated). Owners are always allowed and can manage the list. (Default chosen by the agent; a DB role can replace it later.)
- AI Job Matching report deprioritized; phase 8 (UI redesign) is next, after a review (see Engram `architecture/ai-report-priority`).

## Scope
In: Next.js security upgrade; `allowed_emails` table + migration; server-side gate on every sign-in path (Google and magic link — magic link mail not sent for unknown emails); existing sessions of removed emails lose access; owner-only admin page to list/add/remove emails; "no access" UX on `/ingresar`.
Out: payments, redesign, Resend adapter, pending-approval flow.

## Constraints
- Code, identifiers, comments, tests in English; UI copy in the existing Spanish.
- Screaming architecture (`src/features/<feature>/{domain,infrastructure,ui}`); every check on the server.
- Emails normalized (trim + lowercase) before compare/store.
- Conventional commits, no AI attribution. RDD disabled for this repo; delivery = local merge to `main`.
- ~400 authored lines per task is advisory only.

## TDD
- Mode: **disabled** for this project. Source: explicit user choice (2026-11-21: "no uses TDD", unpaid client), overrides the global strict default. Runner: Vitest (`pnpm test`; db tests need Docker).
- Ordinary functional checks still run per task: existing `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` must pass. New tests are optional.
- RDD: user authorized the agent to enable/grant it when warranted (2026-11-21). Clone is currently RDD-disabled.
- After this feature: phase 8 redesign runs without further approval (user already gave visual feedback; keep the current color palette).

## Tasks
- [x] T3.1 Upgrade Next.js (and matching eslint-config-next if any) to the patched version; test/typecheck/lint/build pass — route: delegated (writer)
- [ ] T3.2 Allowlist domain + `allowed_emails` table/migration + repository; gate in Better Auth (Google + magic link, before user/session creation; magic link not sent when not allowed); session check in `/app` rejects users no longer allowed; owners from `OWNER_EMAILS` always allowed; "no access" message on `/ingresar` — route: delegated (writer)
- [ ] T3.3 Owner admin page (`/app/admin` or similar): list/add/remove allowed emails via server actions authorized as owner; link visible only to owners — route: delegated (writer)

Route evidence: each task touches several non-trivial files (writer trigger).

## Acceptance criteria
- Unknown email: magic link request does not send a link and shows "no access"; Google sign-in with an unknown email creates no user/session and shows "no access".
- Allowed email signs in normally; removing it from the list blocks `/app` on the next request.
- Owner can add/remove emails; non-owners get 403/redirect on the admin page and its actions.
- `/` (landing) reachable without session.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.

## Delivery
- Strategy: direct local merge to `main` (user preference). Forecast: ~500–700 authored lines.

## Progress / evidence
- 2026-11-21: Branch `feat/access-allowlist` created; feature document created.
- 2026-11-21 T3.1 done (commit 96959f4): `pnpm audit` flagged next <=16.4.4 (patched >=16.4.5); upgraded `next` and `eslint-config-next` to exact 16.4.6 (latest on 16.x). Verified: `pnpm audit` no longer lists next; `pnpm typecheck` ok; `pnpm lint` ok; `pnpm test` 60 files / 838 tests passed; `pnpm build` compiled OK. Remaining audit items are transitive dev deps (esbuild via drizzle-kit, glob/minimatch via testcontainers), out of scope.

## Next step
T3.2.
