# Brief: rebuild the a6n plates as real machines

The owner likes exactly one diagram: **Plate II, "The anatomy of a6n"** (`src/machines/system/`). Read it first; it is the bar. Every other plate reads as a *scene* (a room, a counter with props). Rebuild each assigned plate as **one recognisable real-world machine whose motion is the explanation**, like the Anatomy collection (https://skills.wheresryan.sh/anatomy/collection): bookcase = LRU cache, marble run = message queue, model railway = branch and merge, pneumatic tubes = DNS.

Audience: small-business owners who don't know tech. They must get the story from the object alone.

## Read first
- `~/.claude/skills/anatomy/SKILL.md` (all of it) and `~/.claude/skills/anatomy/references/craft.md` (parts vocabulary, painter's order).
- `src/machines/system/geometry.ts`: the house style, the helpers (`slab`, `cyl`, `seg`, `halo`, `tray`), the `data-key`/`tint` use, and how transforms are built.
- `src/lib/plate.ts`: `Machine`, `moverSvg`, `stepSvg`, `transformsFrom`.
- `src/machines/registry.ts`: every mover is auto-tinted its own fresco pigment. To keep a mover untinted (paper, glass), write its `<g class="mover plain" data-part=…>` yourself.
- The kit, `src/lib/anatomy/iso-kit.ts` (vendored, do not edit). **It only extrudes along z.** There are no horizontal cylinders: design rollers, wheels and drums as vertical cylinders, or as slabs.

## Contract (do not break)
- Keep each file's exported builder name, `LABELS` (or `STEP_LABELS`) text and step count, and `CAPTION` **verbatim**. `scripts/check-site.ts` checks the workbench labels and caption.
- Rewrite the figure's `label` (aria) to describe the new machine in plain words, 60+ characters.
- Mover names are free. `transforms[name][i]` is step i+1. The SVG is drawn at the **last** step.
- Touch only `src/machines/<slug>/` (and, for the workbench, `Workbench.astro`'s `title`). If a plate's corner title should change, write the new title in your report; I'll update the page.

## The rules that matter most
1. **Nothing pops in.** Every part that appears at a step is carried, slid, dropped, lifted or swung in from a visible place by a mover. `show-from` is allowed only for things that really appear: light, ink, a printed mark, a stamp, a lamp glow, a needle reading.
2. **One machine, not a room.** Draw an instrument on a base (feet, grooves, corner screws, ruler strip, label plate) like Plate II. No cups, plants or furniture for decoration. Every part belongs to the mechanism.
3. **Each step is readable from a still frame.** Someone looking at step k alone can say what just happened.
4. **No passing through.** Plan rest positions so straight-line glides are clear, or lift with a hover offset (`[dx, dy, dz]`) at an intermediate step.
5. **Colour.** The base and body take the plate pigment from the registry, and movers are auto-tinted. Keep one sanguine `lit` part, at the last step. Never hardcode colours.
6. **Detail.** 100–180 solids, highly detailed at 1× and rewarding at 4×. Keep the plate SVG ≤ 350 KB (`ls -la dist/plates/<slug>.svg`).

## Assignments
Steps are the existing labels, verbatim.

**III `team`, "your shop / our bench inside it / fixed on the spot / one team, yours". Shop counter with a built-in service drawer.** A shop counter (till, bell, shelf brackets behind) on a base. 1: the counter alone, with one loose bracket hanging off. 2: a drawer of our tools slides out *from inside your counter* (in-house, literally). 3: a spanner lifts from the drawer to the bracket and the bracket rotates level. 4: the drawer slides back and the counter's sign lamp lights.

**IV `workbench`, letterpress. Keep the current machine; fix step 3 only.** Add a **furniture rack** (an upright rack of wooden spacers and quoins) beside the stone. At step 3 the furniture and quoins are movers that slide from the rack into the gaps in the chase. Step 4: a printed sheet. Remove the `show-from 3` pop-in.

**V `build-new`, "your idea / drawn up / built from parts / open for customers". Tailor's bench.** A cutting table with a pattern-paper roll, bolts of cloth standing in a rack, shears, a tape measure and a dress form on a stand. 1: a small sketch card pinned on the form. 2: a paper pattern slides out from the roll onto the table, with chalk lines. 3: cut pieces (movers) lift from the cloth bolts onto the dress form. 4: the finished garment on the form; a tag lamp lights. Made to measure from cloth that already exists.

**VI `move-over`, "paper and spreadsheets / fed in / sorted into your app / nothing lost". Post-office sorting frame.** A hopper of mixed paper (a page, a printout, a ledger), a feed slot, a pigeonhole sorting frame with labelled cells, and two tally counters (in and out). 1: the full hopper. 2: the papers drop into the feed. 3: each paper slides into its labelled pigeonhole. 4: the out counter matches the in counter and its lamp lights: nothing lost.

**VII `run-grow`, "your app running / checked every day / fixed and improved / grows with you". Clock movement on a service stand.** An open mantel-clock movement (gear train as stacked vertical cylinders, escapement, a pendulum slab, a dial) on a stand, a loupe on an arm and a parts tray. 1: running. 2: the loupe arm swings over the movement (a gauge needle reads). 3: a fresh gear lifts from the tray into the train. 4: a second module (a chime or complication) slides onto the plate beside it and lights.

**VIII `relay`, "you send a message / kept safe / tried again if needed / it arrives". Marble run, as in Anatomy's message queue.** A hopper (the sender's phone at its foot), a sloping lane, an escapement gate holding the marble (kept safe), a lift or return loop that carries a marble back to the top (tried again), and a receiving cup by the second phone. 1: the marble in the hopper. 2: held at the gate. 3: on the return lift. 4: in the cup; the phone lights.

**IX `build-process`, five steps "we talk / we plan / built from parts / goes live / kept running". Model railway.** A baseboard with one track (made of slabs: sleepers and two rails) running through five small stations, each with a signal post and name board. One train (a mover: loco plus wagon) travels station to station. The last station sits on a loop and the train circles there (kept running). Signals lift as it passes.

**X `tiffingrab`, "customer picks meals / kitchen packs / labelled tins / driver delivers". Dabbawala sorting rack (Mumbai's real tiffin system).** A kitchen rail of tiffin stacks, a phone order card, a coded sorting rack with route slots marked by paint codes, and a bicycle crate. 1: the order card. 2: a tin stack slides from the kitchen rail. 3: it gets its colour-code lid (the code is painted, so `show-from` is allowed for the mark) and slides into its route slot. 4: into the bicycle crate; the crate lamp lights.

**XI `puchkaman`, "menu on your till / same menu online / customer orders and pays / order lands on the till". Lamson cash railway (an old shop's overhead wire carrier).** A till station and a customer tablet station joined by an overhead wire on posts, with a carrier cup on the wire. 1: a menu card on the till. 2: the same card shows at the tablet (a flip-board mirrors it: two split-flap boards on one shaft). 3: a coin and order slip go into the carrier at the tablet. 4: the carrier runs along the wire to the till and the till lamp lights.

**XII `xplorers`, "classes on the board / family picks a seat / pays / seat booked". Box-office ticket rack and dating press.** A pigeonhole rack of class tickets (rows are classes, slots are seats), a coin tray and a ticket dating press (Edmondson style). 1: the rack full. 2: one ticket slides out of its slot. 3: a coin drops into the tray. 4: the ticket goes into the dating press, is stamped (`show-from` stamp mark) and its seat lamp lights.

**XIII `copper-cloves`, "member buys a pass / books a class / scans at the door / class, cafe and shop". Punch-card time clock.** A time clock with a card rack, a class board with peg slots, and a turnstile arm. 1: a pass card slides into the rack. 2: a peg moves from the tray into a class slot. 3: the card drops into the clock and is stamped (`show-from` mark). 4: the turnstile arm swings open (rotate transform) and three small doors' lamps light: class, cafe and shop.

## Verify (required: show evidence)
1. Temporary page `src/pages/preview-<slug>.astro`:
   ```astro
   ---
   import Layout from '../layouts/Layout.astro';
   import Plate from '../components/Plate.astro';
   import { CAPTION } from '../machines/<slug>/geometry';
   ---
   <Layout title="preview" description="preview"><main class="wrap" style="padding:48px 0"><Plate name="<slug>" fig="Plate" title="<slug>" caption={CAPTION} /></main></Layout>
   <script is:inline>
     const n = Number(new URLSearchParams(location.search).get('step') || 0);
     if (n) setTimeout(() => {
       const f = document.querySelector('figure.machine');
       f.querySelector('[data-next]')?.click();
       const t = JSON.parse(f.dataset.transforms);
       setTimeout(() => {
         f.querySelectorAll('.mover').forEach((g) => g.setAttribute('transform', t[g.dataset.part][n - 1]));
         f.querySelectorAll('[data-at]').forEach((g) => g.classList.toggle('on', n >= +g.dataset.at));
       }, 1200);
     }, 1500);
   </script>
   ```
2. `npx astro build` must pass, then `node scripts/check-site.ts` must print `all passed`. Then run `npx astro preview --port <your port>` in the background.
3. For **every step** k: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1440,1000 --virtual-time-budget=6000 --screenshot=<scratch>/<slug>-<k>.png "http://localhost:<port>/preview-<slug>/?step=k"`. Also take one at 390,900. **Read every PNG.** Fix pops, pass-throughs, depth errors and bare faces, then repeat at most twice.
4. Delete the preview page and stop the server before committing.

Scratch dir: `/private/tmp/claude-501/-Users-lawbringr-IdeaProjects-a6n-ai-aether/a12226e0-9e6f-4856-b6f6-09e659cdd49c/scratchpad/`.

Commit per plate on your branch: `Rebuild the <name> plate as a <machine>.` plus a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Report (under 120 words)
Per plate: the machine, the solid count, the SVG KB, what moves at each step, any new corner title, any rule you bent, and the screenshot paths.
