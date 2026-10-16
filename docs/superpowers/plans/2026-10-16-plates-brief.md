# Brief: build Anatomy plates for a6n.ai

You build **two Anatomy machines** (a "plate" each) for the a6n.ai site. They're read by **small business owners who don't know tech**. Read this whole brief, then the reference implementation, before drawing.

## Read first
- Spec: `docs/superpowers/specs/2026-10-16-a6n-site-revamp-design.md`, especially "Diagrams must read for the general public" and the Addendum table.
- Anatomy skill: `~/.claude/skills/anatomy/SKILL.md`, then `references/craft.md` and `references/kit.md`. Follow its craft rules: real objects built from many small parts, solids not wireframes, every line ends on something, no words inside the drawing.
- **Reference implementation (copy its shape):** `src/machines/workbench/geometry.ts`. Shared API: `src/lib/plate.ts`. Renderer: `src/components/Plate.astro`. Pigment CSS: `src/styles/plate.css`.
- Kit (vendored, do not edit): `src/lib/anatomy/iso-kit.ts`. Its API is documented in `~/.claude/skills/anatomy/references/kit.md`.

## What to deliver, per machine
`src/machines/<slug>/geometry.ts` exporting exactly:
```ts
export const LABELS = [/* the step labels from your assignment, verbatim */] as const;
export const CAPTION = '/* the caption from your assignment, verbatim */';
export function <camelSlug>(width = 720, height = 480): Machine  // returns { svg, labels: LABELS, transforms }
```
- Draw the SVG at the **last step** (final state), as the workbench does. Movers use `moverSvg(name, transforms[name][last], body)`, and offsets come from `transformsFrom(P, { name: [offsetStep1, offsetStep2, …] })`, where each offset is relative to where the part was drawn.
- Parts that light up at step N: `stepSvg('lit-at', N, solid with { lit: true })`. Parts that appear at step N: `stepSvg('show-from', N, …)`. Parts that fade back from step N: `stepSvg('dim-from', N, …)`.
- `k.figureSvg({ label })` gets one or two plain sentences telling the whole story (60+ chars). This is the screen-reader version.
- Size: an Anatomy **Figure**, 40–80 parts. Use everyday objects only (no boxes, arrows, servers or clouds). Give it a base on feet, a ruler strip or label plate, screws, bevels, halos and real detail. **One idea per machine**: a non-tech person should be able to retell it after one look.
- Color comes from CSS (`--pigment` is set by the page). Never hardcode colors. Movers automatically get a lighter tint. The one lit part is sanguine.
- No client JS. `src/scripts/plate.ts` already animates any Machine.

## Verify (required, show me evidence)
1. Temporary preview page `src/pages/preview-<slug>.astro`:
   ```astro
   ---
   import Layout from '../layouts/Layout.astro';
   import Plate from '../components/Plate.astro';
   import { <camelSlug>, CAPTION } from '../machines/<slug>/geometry';
   ---
   <Layout title="preview" description="preview"><main class="wrap" style="padding:48px 0"><Plate name="<slug>" machine={<camelSlug>()} fig="Plate" title="<slug>" caption={CAPTION} pigment="<pigment var>" /></main></Layout>
   ```
2. `npx astro build` must pass. Then `npx astro preview --port <your port>` in the background.
3. Screenshot: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1440,1000 --virtual-time-budget=4000 --screenshot=<scratch>/<slug>.png http://localhost:<port>/preview-<slug>/`. This shows the final state at load, because the tour only starts on scroll. **Read the PNG** and fix overlaps, depth-order errors, empty corners and bland faces. Iterate until it reads instantly as a real object. Also screenshot at `--window-size=390,900`.
4. Check every intermediate step: temporarily change the `svg` to render with step-1 transforms, or reason carefully about the transforms, so movers never pass through solids at rest positions.
5. **Delete the preview page** before committing. Stop your preview server.
6. Commit only `src/machines/<slug>/` with message `Draw the <name> plate.` plus a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Report back (short)
Under 120 words: files, part count, what moves at each step, any rule you bent and why. Put screenshot paths in the report.

## Assignments

| slug | camelSlug | pigment var | Steps (labels, verbatim) | Caption (verbatim) | Object idea (adapt freely) |
|---|---|---|---|---|---|
| `team` | `team` | `var(--umber)` | your shop · our bench inside it · fixed on the spot · one team, yours | We work like your own tech team, not a vendor you chase. The same people, every week, building inside your business. | A small shop interior; an a6n workbench with tools slides into its back room; a tool moves to fix a shelf or till; the shop sign lights. |
| `build-process` | `buildProcess` | `var(--umber)` | we talk · we plan · built from parts · goes live · kept running | Every project follows the same path: a conversation, a plan, a build from parts that already work, a launch, and then we keep it running. | 5 stations along one bench or conveyor: two chairs and a table (talk), a drafting board with a sheet (plan), a parts tray and assembly (build), a shop front that lights (live), an oil can and gauge beside it (running). |
| `build-new` | `buildNew` | `var(--umber)` | your idea · drawn up · built from parts · open for customers | Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers. | An easel with a sketch card, a drafting sheet with a ruler, parts assembling into a small storefront that lights. |
| `move-over` | `moveOver` | `var(--umber)` | paper and spreadsheets · fed in · sorted into your app · nothing lost | Already running on paper, spreadsheets or an old system? We move everything across so nothing is lost. | A stack of paper sheets and a ledger fed through a roller press into a neat filing cabinet or drawers; a lit tablet at the end. |
| `run-grow` | `runGrow` | `var(--umber)` | your app running · checked every day · fixed and improved · grows with you | Once you're live, we keep watch every day, fix what breaks and add what you need next. | A running machine with turning gears, a dial gauge whose needle reads, a part swapped by a hand tool, a new module added that makes it taller. |
| `relay` | `relay` | `var(--violet)` | you send a message · kept safe · tried again if needed · it arrives | Receipts, reminders and offers reach your customers. If a message fails, we try again until it arrives. | Pneumatic tube post: a capsule enters a station, rests in a holder, loops a retry bend, and pops out at a receiving phone or mailbox that lights. |
| `tiffingrab` | `tiffingrab` | `var(--ochre)` | customer picks meals · kitchen packs · labelled tins · driver delivers | Customers choose their meals for the week. The kitchen gets the packing sheet and labels, and drivers get their routes. | Stacked tiffin carriers (round tins with clip handles) on a kitchen counter, a label printer, a small delivery van that moves off. |
| `puchkaman` | `puchkaman` | `var(--verdigris)` | menu on your till · same menu online · customer orders and pays · order lands on the till | The menu lives on the restaurant's till. The website shows the same menu, takes the order and payment, and sends it back to the till. | A restaurant till (register with screen and receipt slot) joined to a tablet or phone stand by a belt; a menu card travels out, an order ticket travels back, and the till screen lights. |
| `xplorers` | `xplorers` | `var(--lapis)` | classes on the board · family picks a seat · pays · seat booked | Parents see what's on, pick seats for their kids and pay. Staff see every booking in one place. | A class seat board: rows of small seats or pegs under a schedule rail; a token moves into a seat; a coin drops into a slot; the seat lights. |
| `copper-cloves` | `copperCloves` | `var(--sanguine)`, so make the lit part read clearly against it (e.g. lit only the gate light) | member buys a pass · books a class · scans at the door · class, cafe and shop | Members buy a pass, book a class and scan in at the door. The cafe and shop live in the same app. | A studio entrance: a pass card, a booking board, a QR turnstile gate that opens, with a mat, a coffee cup and a shop shelf beyond. |

`--violet` is `#6b4f7a` (Relay's violet umber). If it's missing from `src/styles/global.css` `:root`, add `--violet: #6b4f7a;` next to `--lapis`. That one line is allowed outside your directory.
