# Feature: DB + accounts (phase 4)

## Objective
Move each user's data from `localStorage` into normalized Postgres tables and add accounts, so the later AI phase (quota, stored reports) has a real user identity.

## Problem / Why
All state lives in one browser (`radar-postulaciones-v1`). There is no identity, no cross-device access, and server-side AI quota would be trivially resettable.

## Decisions (with the user, 2026-11-03)
- Stack: **Neon** (serverless Postgres) + **Drizzle** + **Better Auth**. Never Supabase.
- Login: **Google OAuth + email magic link**. No passwords.
- Data model: **normalized tables from the start** (not one JSONB blob per user).
- No data importer from `localStorage` (no real users). The backup JSON export/import keeps working and becomes the way to move old data in.
- Engram note: saving the login decision failed twice (`repository_binding_unavailable`), then Engram recovered; mirror saved under `odd/db-accounts/tasks` (includes the login decision).

## Scope
In: DB foundation, schema, repository (load/replace state), auth (Google + magic link, sign-in page, `/app` protection, sign-out), per-entity server writes, client store synced with the server, removal of `localStorage` app-state persistence.
Out: AI server calls and quota (next phase), payments, owner/admin role, redesign, production email provider choice (dev logs the magic link to the console; prod sender is a port, provider TBD).

## Constraints
- Code, identifiers, comments, tests in English; UI copy in the existing Spanish.
- Screaming architecture: `src/features/<feature>/` with `domain/` (pure), `infrastructure/` (Drizzle, Better Auth, email), `ui/`. DB client in `src/shared/db/` (or `src/server/db/`), server-only.
- Every server read/write is scoped by the session user id, checked on the server (never trust a client-sent user id).
- Conventional commits, no AI attribution lines. Work-unit commits per task. RDD disabled for this repo; delivery = local merge to `main` (no remote).
- ~400 authored lines per task is an advisory heuristic only.

## Technical design
- **Versions (npm, 2026-11-03):** better-auth 1.7.15, @better-auth/drizzle-adapter 1.7.15, drizzle-orm 0.45.4, drizzle-kit 0.31.11, @neondatabase/serverless 1.2.0, @electric-sql/pglite 0.5.15. Pin exact versions.
- **Driver:** `drizzle-orm/neon-serverless` (WebSocket Pool; supports transactions, needed for state replace). Driver choice isolated in one factory; repositories take a generic Drizzle pg database type.
- **Tests:** in-process Postgres via PGlite (`drizzle-orm/pglite`), migrations applied per test file. No Neon connection in tests. Unverified: PGlite migrator path and Better Auth on PGlite → smoke-test in T2.1/T2.4.
- **Migrations:** drizzle-kit, single pipeline; Better Auth tables generated with `npx auth@latest generate --output` into the schema folder and re-exported. Migrations use Neon's direct (non-pooled) URL.
- **Schema (per user, composite PK `(user_id, id)` because client ids from `uid()` are short and only unique per user; FK `user_id text` → Better Auth `user.id`, cascade delete):**
  - Singletons: `profiles` (profile fields + `goal`, `goal_set`, `rev_freq`), `drafts` (new-offer form), `user_modules` (8 booleans), `career_base` (5 texts), `personal_brand` (4 texts).
  - `applications` (scalar fields + `ficha_*` columns + `match jsonb` (derived, nested) + `report text`, `revisado`, `hallazgos`, `position`), `interviews` (FK application), `application_checklist` (application, item key, `ok`, `txt`).
  - `platforms` (id = slug, `custom`, `position`), `search_checks` (month, platform_id, day) — cascade on platform delete.
  - `plan_week_vars` (week, var_id, position), `plan_targets` (key, value) for `metas`.
  - One table per registry: `objectives`, `network_records`, `posts`, `time_logs`, `reviews`, `employers`, `experiments`, `metrics`, `rest_days`. All select-like fields are plain `text` (saved values may fall outside option lists — no DB enums). Index `(user_id, fecha)` where read by date range.
  - Dropped: `contactos` (schemaless, unused, no UI) — `hydrate` keeps returning `[]`.
- **Repository:** `loadState(userId) → AppState` assembled from rows and passed through `hydrate`/`withSyncedName`; `replaceState(userId, state)` in one transaction (import backup, recalc all). Round-trip tests against the existing golden fixtures.
- **Writes:** typed commands per entity (e.g. `app.create`, `app.setField`, `interview.add`, `registry.setField`, `platform.remove`, `check.toggle`, `profile.setField`, `module.toggle`, `state.replace`). Client applies the existing pure domain function optimistically, then sends the command to a server action that applies it at row level for the session user. Text fields stay debounced per field; discrete actions immediate. Failed command → toast + reload from server.
- **Auth:** Better Auth with `drizzleAdapter(db, { provider: "pg" })`, Google provider, `magicLink` plugin (sender port: console in dev), `nextCookies()` last. Route `app/api/auth/[...all]/route.ts`. `proxy.ts` (Next 16 rename of middleware) does an optimistic cookie check → `/ingresar`; real `auth.api.getSession` in `/app` layout and in every server action. "Salir" signs out.

## TDD
- Mode: strict, enabled. Source: user global config (`~/.claude/CLAUDE.md`). Runner: Vitest (`pnpm test`).
- RED → GREEN → REFACTOR for domain, repository (PGlite) and server actions; view tests first too.

## Tasks
- [ ] T2.1 DB foundation: deps, `db` factory (neon-serverless) + PGlite test harness, drizzle-kit config, env schema (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`), first empty migration runs in tests — route: delegated (writer)
- [ ] T2.2 Schema: Better Auth tables + all domain tables above, migration generated — route: delegated (writer)
- [ ] T2.3 Repository: `loadState` / `replaceState` with fixture round-trip tests — route: delegated (writer)
- [ ] T2.4 Auth: Better Auth config, Google + magic link (console sender), route handler, `proxy.ts`, `/ingresar` page, `/app` session gate, "Salir" sign-out — route: delegated (writer)
- [ ] T2.5 Commands: typed per-entity commands + server actions applying them at row level, authorized by session — route: delegated (writer)
- [ ] T2.6 Client sync: store loads from server, optimistic apply + send commands, debounce per field, error recovery; remove `localStorage` app-state persistence; backup import/export through the server — route: delegated (writer)

Route evidence: every task touches several non-trivial files (writer trigger); design reading already done by two read-only workers (domain map + library research).

## Acceptance criteria
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Signing in with Google or a magic link opens `/app`; signed-out users are redirected to `/ingresar`.
- Every current write path persists to the DB and survives a reload and a second device; one user never sees another user's data.
- Backup export → import round-trips through the DB.

## Needs from the user (before T2.4 runs end-to-end)
- Neon project: pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` (dev branch is fine).
- Google Cloud OAuth client (ID + secret) with redirect `http://localhost:3000/api/auth/callback/google`.
- `BETTER_AUTH_SECRET` can be generated locally. T2.1–T2.3 need none of these (PGlite).

## Delivery
- Strategy: direct local merge to `main` when the phase is done (user preference). Forecast: well above 400 authored lines.

## Progress / evidence
- 2026-11-03: Exploration done (domain map: ~14 collections, all fixed field sets; library research with sources). Feature document created on branch `feat/db-accounts`.

- 2026-11-03: Session closed by the user before confirming the plan. Plan confirmation and pending decisions deferred to the next session.

## Next step
1. Next session: user reviews/confirms this plan (schema, commands design, task split) → then T2.1.
2. Later (before T2.4): Neon connection strings + Google OAuth client; prod email provider for magic link.
