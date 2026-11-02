# Feature: Next.js migration (phases 0–1)

## Objective
Turn the single-file Claude artifact (`legacy/index.html`) into a real Next.js web app with feature parity, as the foundation for DB, auth, AI, payments, and redesign (later phases).

## Problem / Why
The artifact is ~1160 lines of vanilla JS with string-template rendering and `localStorage` state. It cannot host a backend (AI calls, payments, DB) and lost the `sample` (AI) and `downloads` capabilities outside claude.ai.

## Scope (this document)
- Phase 0: git repo + legacy reference commit.
- Phase 1: Next.js (App Router) + TypeScript + Tailwind + Vitest; port domain logic and all views with parity. State stays client-side (`localStorage`, same key `radar-postulaciones-v1`) until Phase 2 (DB).

Out of scope here: DB, auth/roles, AI server calls, downloads, payments (dLocal Go), redesign. AI report button and JSON export stay hidden/disabled exactly as the artifact behaves without capabilities.

## Constraints
- Generated artifacts in English (code, comments, identifiers); UI copy stays in the existing Spanish (Rioplatense) since we are extending that product.
- Screaming architecture: `src/features/<feature>/` with container/presentational split; pure domain logic in framework-free modules.
- Conventional commits, no AI attribution lines. One work-unit commit per task.
- ~400 authored lines per task is an advisory heuristic only.

## TDD
- Mode: strict, enabled. Source: user global config (`~/.claude/CLAUDE.md`, "Strict TDD Mode: enabled").
- Runner: Vitest (`pnpm test`), installed in T1.1.
- RED → GREEN → REFACTOR for domain logic; views verified by build + typecheck + lint + smoke render tests where practical.

## Tasks
- [x] T0.1 `git init`, `.gitignore`, legacy artifact committed at `legacy/index.html` — route: inline — commit `a4009db`
- [x] T1.1 Scaffold Next.js (App Router, TS strict, Tailwind, ESLint, pnpm) + Vitest; `pnpm build/lint/test` green — route: delegated (writer) — commit `21876b1`
- [x] T1.2 Port pure domain logic to `src/` with tests first: utils/dates, `guessName`, `redact`, match engine, indicators (VARS), registry definitions, state `blank`/`hydrate` — route: delegated (writer) — commit `dff3959`
- [x] T1.3 Client state store with `localStorage` persistence (same key, `hydrate` compatible) — route: delegated (writer) — commit `76eff08` (zustand)
- [ ] T1.4 Public landing `/` with plans & pricing by country, theme toggle — route: delegated (writer)
- [ ] T1.5 App shell `/app` + tabs: Resumen, Plan, Red, Visibilidad, Empleadores, Experimentos — route: delegated (writer)
- [ ] T1.6 Postulaciones list + detail drawer, Nueva oferta, Análisis, Mi CV (pdf.js), Búsqueda diaria — route: delegated (writer)

Route evidence: phase 1 touches many non-trivial files (writer trigger) and requires reading the 1160-line legacy file (preparation trigger).

## Acceptance criteria
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- Every legacy tab and the landing render with the same data/behavior; existing `localStorage` data loads unchanged.

## Delivery
- Strategy: ask-on-risk. Forecast: well above 400 authored lines → chained PRs will be needed; chain strategy to be asked before the first PR.

## Progress / evidence
- 2026-11-01: T0.1 done (`a4009db` on `main`). Branch `feat/nextjs-migration` created.
- 2026-11-02: T1.1–T1.3 done by delegated writer. Stack: Next 16.4, React 19.3, Tailwind 4, TS 5.9, Vitest, zustand. Writer verification: lint ✓, typecheck ✓, test ✓ (17 files / 281 tests), build ✓. Parent spot check: `pnpm test` 281/281 ✓, `pnpm typecheck` ✓. TDD: tests written first (RED at import level), behavior pinned with golden fixtures generated from legacy code.
- Notable deviations: time-dependent functions take a `today` arg; `hydrate` is non-mutating and tolerates non-objects; view helpers (`esc`, `md`, HTML builders) not ported yet (belong to views).
- Review (RDD): range `a4009db..76eff08` assessed medium (`slice_budget_reached`); consent granted; START refused with `lens_context_budget_exceeded` (15.5k lines, mostly `pnpm-lock.yaml` + golden JSON fixtures). No authority created. Pending user decision on how to reduce scope.

- 2026-11-02: User agreed to review only the store commit (`dff3959..76eff08`, ~440 lines) and treat scaffold/lockfile/fixtures as not reviewable. Not run yet — session closed.

## Next step
1. Run native review for range `--base-ref dff3959 --committed-only` (store commit).
2. T1.4 (landing + pricing + theme).
