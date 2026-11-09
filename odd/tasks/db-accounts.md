# Feature: DB + accounts (phase 4)

## Objective
Move each user's data from `localStorage` into normalized MySQL tables and add accounts, so the later AI phase (quota, stored reports) has a real user identity.

## Problem / Why
All state lives in one browser (`radar-postulaciones-v1`). There is no identity, no cross-device access, and server-side AI quota would be trivially resettable.

## Decisions (with the user, 2026-11-03)
- Stack: **Hostinger Business MySQL** + **Drizzle** + **Better Auth**. Never Supabase. (Client chose Hostinger for everything on 2026-11-09 — app, DB, domain, email; supersedes the earlier Neon/Postgres choice.)
- Transactional email (magic link): **Resend** free tier.
- Login: **Google OAuth + email magic link**. No passwords.
- Data model: **normalized tables from the start** (not one JSON blob per user).
- No data importer from `localStorage` (no real users). The backup JSON export/import keeps working and becomes the way to move old data in.
- Engram note: saving the login decision failed twice (`repository_binding_unavailable`), then Engram recovered; mirror saved under `odd/db-accounts/tasks` (includes the login decision).

## Scope
In: DB foundation, schema, repository (load/replace state), auth (Google + magic link, sign-in page, `/app` protection, sign-out), per-entity server writes, client store synced with the server, removal of `localStorage` app-state persistence.
Out: AI server calls and quota (next phase), payments, owner/admin role, redesign, wiring the Resend sender (dev logs the magic link to the console; prod sender is a port, Resend adapter added before deploy).

## Constraints
- Code, identifiers, comments, tests in English; UI copy in the existing Spanish.
- Screaming architecture: `src/features/<feature>/` with `domain/` (pure), `infrastructure/` (Drizzle, Better Auth, email), `ui/`. DB client in `src/shared/db/` (or `src/server/db/`), server-only.
- Every server read/write is scoped by the session user id, checked on the server (never trust a client-sent user id).
- Conventional commits, no AI attribution lines. Work-unit commits per task. RDD disabled for this repo; delivery = local merge to `main` (no remote).
- ~400 authored lines per task is an advisory heuristic only.

## Technical design
- **Versions (npm, 2026-11-09):** better-auth 1.7.18 (+ matching @better-auth/drizzle-adapter), drizzle-orm 0.45.4, drizzle-kit 0.31.11, mysql2 3.24.6, @testcontainers/mysql 12.2.1. Pin exact versions; re-check at install.
- **Driver:** `drizzle-orm/mysql2` with a `mysql2` pool (supports transactions, needed for state replace). Driver choice isolated in one factory; repositories take a generic Drizzle MySQL database type.
- **Tests:** real MySQL via Testcontainers (`@testcontainers/mysql`), one container per test run, migrations applied once, tables truncated between tests. Requires Docker Desktop running locally. Match the MySQL major version to Hostinger's (verify in hPanel). Unverified: Better Auth on MySQL through the Drizzle adapter → smoke-test in T2.4.
- **Migrations:** drizzle-kit (`dialect: "mysql"`), single pipeline; Better Auth tables generated with `npx auth@latest generate --output` into the schema folder and re-exported.
- **MySQL specifics:** no `jsonb` → `json` columns; text PK/FK columns must be `varchar(n)` (MySQL cannot index unbounded `text`); booleans as `boolean` (tinyint); `utf8mb4` charset.
- **Hosting (unverified):** Hostinger Business Node.js app connecting to the plan's MySQL (host, remote vs local access, connection limits) → verify before the first deploy.
- **Schema (per user, composite PK `(user_id, id)` because client ids from `uid()` are short and only unique per user; FK `user_id varchar` → Better Auth `user.id`, cascade delete):**
  - Singletons: `profiles` (profile fields + `goal`, `goal_set`, `rev_freq`), `drafts` (new-offer form), `user_modules` (8 booleans), `career_base` (5 texts), `personal_brand` (4 texts).
  - `applications` (scalar fields + `ficha_*` columns + `match json` (derived, nested) + `report text`, `revisado`, `hallazgos`, `position`), `interviews` (FK application), `application_checklist` (application, item key, `ok`, `txt`).
  - `platforms` (id = slug, `custom`, `position`), `search_checks` (month, platform_id, day) — cascade on platform delete.
  - `plan_week_vars` (week, var_id, position), `plan_targets` (key, value) for `metas`.
  - One table per registry: `objectives`, `network_records`, `posts`, `time_logs`, `reviews`, `employers`, `experiments`, `metrics`, `rest_days`. All select-like fields are plain `text` (saved values may fall outside option lists — no DB enums). Index `(user_id, fecha)` where read by date range.
  - Dropped: `contactos` (schemaless, unused, no UI) — `hydrate` keeps returning `[]`.
- **Repository:** `loadState(userId) → AppState` assembled from rows and passed through `hydrate`/`withSyncedName`; `replaceState(userId, state)` in one transaction (import backup, recalc all). Round-trip tests against the existing golden fixtures.
- **Auth adapter:** `drizzleAdapter(db, { provider: "mysql" })`. Magic-link sender is a port: console in dev, Resend in prod.
- **Writes:** typed commands per entity (e.g. `app.create`, `app.setField`, `interview.add`, `registry.setField`, `platform.remove`, `check.toggle`, `profile.setField`, `module.toggle`, `state.replace`). Client applies the existing pure domain function optimistically, then sends the command to a server action that applies it at row level for the session user. Text fields stay debounced per field; discrete actions immediate. Failed command → toast + reload from server.
- **Auth:** Better Auth with the MySQL Drizzle adapter above, Google provider, `magicLink` plugin (sender port: console in dev), `nextCookies()` last. Route `app/api/auth/[...all]/route.ts`. `proxy.ts` (Next 16 rename of middleware) does an optimistic cookie check → `/ingresar`; real `auth.api.getSession` in `/app` layout and in every server action. "Salir" signs out.

## TDD
- Mode: strict, enabled. Source: user global config (`~/.claude/CLAUDE.md`). Runner: Vitest (`pnpm test`).
- RED → GREEN → REFACTOR for domain, repository (Testcontainers MySQL) and server actions; view tests first too.

## Tasks
- [x] T2.1 DB foundation: deps, `db` factory (mysql2 pool) + Testcontainers MySQL test harness, drizzle-kit config, env schema (`DATABASE_URL`), first empty migration runs in tests — route: delegated (writer)
- [x] T2.2 Schema: Better Auth tables + all domain tables above, migration generated — route: delegated (writer)
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
- Local dev DB: Docker MySQL (no client input needed). Hostinger MySQL credentials only for deploy.
- Google Cloud OAuth client (ID + secret) with redirect `http://localhost:3000/api/auth/callback/google`.
- Resend API key + verified sender domain (prod only).
- `BETTER_AUTH_SECRET` can be generated locally. T2.1–T2.3 need none of these (Docker Desktop must be running for tests).

## Delivery
- Strategy: direct local merge to `main` when the phase is done (user preference). Forecast: well above 400 authored lines.

## Progress / evidence
- 2026-11-03: Exploration done (domain map: ~14 collections, all fixed field sets; library research with sources). Feature document created on branch `feat/db-accounts`.

- 2026-11-03: Session closed by the user before confirming the plan. Plan confirmation and pending decisions deferred to the next session.

- 2026-11-09: Client approved the plan and chose Hostinger for everything → DB switched from Neon/Postgres to MySQL; tests switched from PGlite to Testcontainers MySQL; Resend for magic link.

- 2026-11-09: T2.1 done (commit 52de195). RED: db/env tests failed (missing modules, global-setup not found). GREEN: pnpm test 48 files / 511 tests pass (db project: 4 tests vs real MySQL), typecheck, lint, build pass. Installed: drizzle-orm 0.45.4, mysql2 3.24.6, drizzle-kit 0.31.11, @testcontainers/mysql 12.2.1. Test image: mysql:8.0 (Hostinger major unverified). Vitest projects: unit + db (*.db.test.ts). First migration drizzle/0000_init.sql is a no-op.

- 2026-11-09: T2.2 done (commit 26e189b). RED: schema.db.test.ts failed (module ./index missing), then a first schema failed 4 tests (TEXT columns without default). GREEN: pnpm test 49 files / 518 tests, typecheck, lint, build pass. Installed better-auth 1.7.18 + @better-auth/drizzle-adapter 1.7.18 (exact). Auth schema: `npx auth@latest generate` hung (killed after ~3 min), so src/shared/db/schema/auth-schema.ts was written by hand in the CLI's MySQL shape and checked field by field against getAuthTables() of the installed package (user, session, account, verification; varchar(36) ids, fsp 3 timestamps, snake_case columns, camelCase keys). Layout: domain tables live in src/features/<feature>/infrastructure/schema.ts, re-exported from src/shared/db/schema/index.ts (drizzle.config now points there; shared helpers in schema/columns.ts); relative imports because drizzle-kit does not resolve the alias. Migration drizzle/0001_*.sql (25 tables). Mapping decisions: interviews PK (user_id, application_id, id) and checklist PK (user_id, application_id, item_key) so duplicate ids across applications in old backups cannot collide; every ordered collection has `position`; short strings varchar(255) default '', dates varchar(32) default '' (tolerates legacy values), TEXT/MEDIUMTEXT use expression default ('') because MySQL rejects literal TEXT defaults (needs MySQL 8.0.13+ / MariaDB 10.2.1+); cv, jd, report are mediumtext; `pre` -> application_checklist rows, `metas` -> plan_targets, `contactos` dropped. Unverified: Hostinger server flavor/version (MySQL vs MariaDB); T2.3 must drop orphan checks whose platform no longer exists and coerce missing legacy fields to ''.

## Next step
1. T2.3 repository: `loadState` / `replaceState` with fixture round-trip tests (Docker Desktop running).
2. Before T2.4: Google OAuth client. Before deploy: Hostinger MySQL credentials, verify Node app ↔ MySQL on Hostinger, Resend key + domain.
