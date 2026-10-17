# Brief: the "anatomy of a6n" plate (slug `system`)

Build a new Anatomy machine that explains what a6n is. a6n is short for "(Ai)ny Management System": one system that joins everything a small business runs on. Read `docs/superpowers/plans/2026-10-16-plates-brief.md` (API, rules, verification) and `docs/superpowers/plans/2026-10-17-plates-detail-brief.md` (the detail bar). Follow both. This is a **Hero**-size figure: 130–180 parts, the richest plate on the site.

- File: `src/machines/system/geometry.ts`. Export `LABELS`, `CAPTION`, and `system(width = 760, height = 520): Machine`.
- Pigment: `var(--umber)`. The lit parts are sanguine.
- LABELS (verbatim): `your tools today` · `joined into one` · `shaped around you` · `running every day`
- CAPTION (verbatim): `a6n joins your website, customer app, payments, messages, staff screen and reports into one system, then shapes it around how your business works.`

## The object
A central **control desk / switchboard cabinet** (the hub) stands in the middle of a large bench, with a screen, a nameplate, a row of sockets and indicator lamps. Six **modules** belong around it, each a real small object with a small engraved numeral tag 1–6. These tags are the plate's legend keys, the one place text is allowed in the drawing; use `k.faceTextSvg` on a top face, size 3–4.
1. Website: a small shop front with an awning and a window.
2. Customer app: a phone on a stand.
3. Payments: a card terminal with a coin tray.
4. Messages: a pneumatic message tube or a post box.
5. Staff screen: a desk monitor with a keyboard.
6. Reports: a ledger book with a dial gauge.

## Steps
1. **your tools today:** the six modules sit scattered and loose around the edges of the bench, unconnected, some tilted at odd spots (as movers at rest).
2. **joined into one:** each module slides into its dock around the hub (6 movers), and cables from each dock to the hub appear (`show-from` 2). Cables are `lineSvg` wires ending in terminal dots.
3. **shaped around you:** a nameplate and a small brand flag on the hub appear (`show-from` 3). Dock lamps take a soft tint.
4. **running every day:** the hub screen and every module's lamp light sanguine (`lit-at` 4).

Moves are straight lines that never pass through solids. Plan the loose positions so each path is clear. Verify every step by rendering it.

## Worktree
Work ONLY in `/Users/lawbringr/IdeaProjects/a6n-ai/plates-wt/d5` (branch `detail-d5`). Preview port 4561. Screenshots go in `/private/tmp/claude-501/-Users-lawbringr-IdeaProjects-a6n-ai-aether/a12226e0-9e6f-4856-b6f6-09e659cdd49c/scratchpad/detail/d5/`. Commit only `src/machines/system/` as `Draw the anatomy of a6n plate.` plus a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Report in under 120 words.
