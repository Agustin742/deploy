# Feature: UI redesign (phase 8)

## Objective
Re-hierarchize and restyle the landing and the app so the core value (loading applications fast + the dashboards they produce, plus accounts) is obvious, the landing sells the 1-year access, and nothing scrolls sideways. Keep the current color palette.

## Problem / Why
Owner feedback (2026-11-21): ugly buttons; bad hero; badly built country dropdown; pricing cards not designed to sell; FAQ separated; landing and Resumen poorly hierarchized (everything the same size); navbar with horizontal scroll. Two read-only reviews (impeccable audit + UX/IA review) confirmed root causes:
- Brand fonts (Exo 2, Source Sans 3, IBM Plex Mono) are declared in `globals.css` but never loaded → system fallback everywhere.
- No type/spacing/radius scale; every surface is the same `panel` card; lime unused as CTA.
- Nav: 11 tabs in an `overflow-x-auto` strip (`app-header.tsx:29`).
- Resumen: 6 equal KPIs + 5 equal panels; charts (core value) last; deprioritized metrics (match, network) at equal weight.
- Pricing: 6 equal cards, main product not dominant, no CTA, native select.
- Applications table `min-w-[860px]`, 3 of 7 columns are AI-matching output.

## Decisions
- Palette preserved exactly (tokens in `src/app/globals.css`). Lime becomes the single main CTA color per view.
- AI Job Matching report de-emphasized (collapsed "Avanzado" in the drawer), not removed.
- Primary nav: Resumen, Postulaciones, Análisis, Plan, Mi CV + "Más" (Red, Visibilidad, Búsqueda diaria, optional Empleadores/Experimentos). "Nueva oferta" becomes a global "+ Cargar postulación" action. Account menu holds theme, Accesos (owners), Salir. Mobile: bottom bar.
- Landing pricing: one dominant plan (the tool), services as a compact secondary list, free diagnostic as a banner; purchase CTA goes to the existing contact channel until the payment flow exists (manual transfer).
- Hero: two columns with an image slot (placeholder until the owner sends the image).
- No TDD (user choice); existing test/typecheck/lint/build must pass; tests that assert old markup/copy are updated.

## Tasks
- [ ] R1 Foundations: load fonts with `next/font`; type/spacing/radius scale; `Button`, `Select`, card levels, `Kpi` sizes; tags ≥12px; stronger focus/input borders — route: delegated (writer)
- [ ] R2 App shell: new nav (primary + Más), account menu, global "+ Cargar postulación", mobile bottom bar, no horizontal scroll, fallback tab Resumen — route: delegated (writer)
- [ ] R3 Resumen: hero KPI row (Postuladas este mes vs meta with inline edit, En curso, Tasa de respuesta, Total), big monthly chart + Por estado, Por fuente + "Lo que sigue" (platforms today), section captions, better empty state; drop Conexiones/Coincidencia KPIs and "Esta semana" panel — route: delegated (writer)
- [ ] R4 Applications: quick-add (link/JD first, Empresa+Puesto, rest under "Más detalles", match shown small), no example/clear buttons in the main form; table 5 columns + card list below md; one toolbar; drawer reorder with AI block collapsed — route: delegated (writer)
- [ ] R5 Landing: sticky header with anchors, hero with image slot, value strip, pricing redesign (dominant plan, country combobox, services list, diagnostic banner), FAQ accordion under pricing, final CTA band, footer with contact/legal; draft banners only outside production — route: delegated (writer)

## Acceptance criteria
- No horizontal page scroll at 360px, 768px, 1280px on landing and app screens touched.
- Palette tokens unchanged.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- Owner visual check.

## Delivery
- Direct local merge to `main` (user preference). Forecast: large (well above 400 lines); one commit per task.

## Progress / evidence
- 2026-11-21: Reviews done (impeccable audit + UX/IA). Document created. Waits for `feat/access-allowlist` to finish (shared files: app header, sign-in).

## Next step
R1 after access-allowlist is merged.
