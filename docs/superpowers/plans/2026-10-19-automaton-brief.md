# Brief: Plate XIV "The automaton", the closing scene of the home page

The home hero is Michelangelo's Creation of Adam, split at the finger gap: on scroll the two hands reach for each other. The closing section ("Tell us about your business." + Book a call) must answer it with **a mechanical man**: a wood-and-brass automaton on a workshop stand that is assembled, wound up, and finally **raises its right hand, palm open and index finger extended, toward the visitor**, the same reach as Adam's hand. It is the a6n system: made of parts, wound once, then it works on its own and reaches out to you. Owner chose this; it must be the most striking plate on the site. Bar: Plate II (`src/machines/system/`), the Anatomy examples (`~/.claude/skills/anatomy/examples/test-rig`, `arcade-cabinet`) and the collection.

Size: **Hero** (100–160 solids).

## Read first
- `~/.claude/skills/anatomy/SKILL.md`, `references/craft.md`, `references/motion.md`.
- `src/machines/system/geometry.ts` and `src/machines/team/geometry.ts` (house style, helpers, `data-key`/`tint`).
- `src/lib/plate.ts` (`Machine`, `moverSvg`, `stepSvg`, `transformsFrom`), `src/machines/registry.ts`, `src/components/Plate.astro`, `src/scripts/plate.ts`.
- `src/lib/anatomy/iso-kit.ts` (do not edit). It only extrudes along z: no horizontal cylinders. Build limbs as stacked z-extrusions (boxes, vertical cylinders, slabs) and joints as vertical-axis discs/knuckles; a forearm that is raised can be drawn as a mover rotated in screen space about the projected elbow/shoulder point (transforms may translate and rotate).

## The machine
A standing automaton about half the card height, three-quarter view (azimuth ~35–45° so the raised right arm is in profile against empty card), on a low workshop stand/plinth with feet, a ruler strip, corner screws and a small engraved label plate ("a6n"). Body: carved wooden torso panel with a hinged chest door showing a brass mainspring barrel and two gear wheels (vertical-axis discs with teeth/knurl), a cam stack; brass collar; head as a turned block with a visor slot and two rivet eyes; segmented arms (shoulder knuckle, upper arm, elbow knuckle, forearm, wrist, hand with a separate extended index finger and folded fingers); legs fixed to the stand. A winding key on its back. A tool tray on the stand with a spare gear and a screwdriver is fine if it belongs.

## Steps (exports: `automaton` builder, `LABELS`, `CAPTION`; register as `automaton` in `registry.ts` with pigment `var(--umber)` and `lit: 'var(--ochre)'`)
- `LABELS = ['parts on the bench', 'put together', 'wound once', 'reaching out']`
- `CAPTION = "Made from parts that already work, wound once, then it runs on its own. The last move is always the same: a hand held out to you."`
1. Parts laid out on the stand beside the empty frame: arms, head and chest door lie flat on the tray side (movers at offsets).
2. Parts lift and slide onto the frame: head drops onto the collar, arms swing onto the shoulders, chest door closes.
3. The key on its back turns (rotate mover), the gear train inside turns (gears rotate a few teeth), a small `show-from` ink tick shows on a wind gauge.
4. The right arm rises: shoulder and elbow rotate so the forearm points up and toward the viewer's upper-left (mirror of God's hand reaching right-to-left in the hero), hand open, index finger extended. The index fingertip is the one **lit** part (ochre). The head turns slightly toward the hand.
The SVG is drawn at step 4 (the raised arm is the still, no-JS picture and must be the poster frame).

## Rules
1. Nothing pops in. Parts arrive by sliding, lifting, dropping, swinging from a visible place. `show-from` only for ink/marks/lamp glow.
2. One machine on its stand. No floating props. Every line resolves on something.
3. Each step readable from a still frame; step 4 is the poster: it must look like a figure reaching out, readable at a glance at 390 px wide.
4. No passing through at any step: plan rest positions; use hover offsets for intermediate moves.
5. Colour from the registry pigment; movers auto-tinted; one `lit` part at the last step. Never hardcode colours.
6. viewBox 720x480 (or taller, e.g. 720x600, if the standing figure needs it; say so in the report). SVG ≤ 400 KB (`ls -la dist/plates/automaton.svg`).
7. Rewrite the svg `aria-label` (60+ chars) to describe the figure at step 4.
8. Touch only `src/machines/automaton/` and the one registry line.

## Verify (show evidence)
1. Worktree setup: `ln -s /Users/lawbringr/IdeaProjects/a6n-ai/aether/node_modules node_modules` in your worktree root.
2. Temporary page `src/pages/preview-automaton.astro` (same as earlier briefs: renders `<Plate name="automaton" .../>` and a `?step=k` script that applies `transforms[part][k-1]` and toggles `[data-at]`). Delete it before committing.
3. `npx astro build` passes and `node scripts/check-site.ts` prints `all passed`. `npx astro preview --port 4421` in the background.
4. Screenshot every step at 1440x1000 and step 4 at 390x900 with headless Chrome (`--virtual-time-budget=6000`). **Read every PNG.** Zoom 4x on the hand, the chest door gears and the stand. Fix pops, pass-throughs, depth errors, bare faces. At most three fix rounds.
5. Stop the server before committing.

Scratch: `/private/tmp/claude-501/-Users-lawbringr-IdeaProjects-a6n-ai-aether/62e90eac-6fec-49ba-b793-4cf2248c4f00/scratchpad/`.

Commit on your worktree branch: `Build the automaton plate for the closing scene.` + blank line + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Report (under 120 words)
Solid count, SVG KB, viewBox, what moves at each step, the projected screen point of the lit fingertip at step 4 (x,y in viewBox units), rules bent, screenshot paths, branch name and commit hash.
