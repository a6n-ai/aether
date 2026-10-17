# Brief: detail pass on a6n.ai plates

The owner wants every diagram **richer and more detailed**. You'll improve existing machines in `src/machines/<slug>/geometry.ts`. Keep each machine's story, labels, caption, mover names and step count **unchanged**. `src/scripts/plate.ts` and `src/components/Plate.astro` read them.

## Read first
- `~/.claude/skills/anatomy/SKILL.md`: "Every creation is highly detailed", "Two looks", "Check it last", and the craft rules.
- `~/.claude/skills/anatomy/references/craft.md`: the parts vocabulary with recipes.
- The original brief: `docs/superpowers/plans/2026-10-16-plates-brief.md` (API, verification, copy rules).
- Kit API: `src/lib/anatomy/iso-kit.ts` (vendored, don't edit) and `~/.claude/skills/anatomy/references/kit.md`.

## The bar
- **At 1×** it reads instantly as one real object that tells its story.
- **At 4×** every region still has something true to find. No bare slab face, no empty corner of the base, no plain block standing in for a real thing.

Add real parts that belong to the object:
- screws (0.45 dots with a ring) at plate corners
- bevels (0.4–1.6) on every slab
- seams (`k.sideSeam` as the slab's `inner`)
- grooves inset 3–5 from edges
- knurls on knobs
- ruler strips with `topTicks`
- label plates with three rule lines
- feet under bases
- hinges, handles, vents (closed slots), cable runs between powered things (as `lineSvg` wires ending in terminal dots)
- small props that fit the scene: cups, plants, receipt rolls, price tags, menu cards, chairs, clocks, lamps

Target **90–130 parts** per machine. Every line ends on something. Things sit on things, with halos under lifted parts. Keep one lit part per step (sanguine), and never hardcode colors.

## Movement
Moving parts must never pass through solids at any step. Check each step's pose by rendering it. A quick way: temporarily make `transforms[name][last]` use step k's offset, build and screenshot, then revert. Movers that travel far may go through an extra lifted waypoint only if you add a step offset; don't add steps. Instead, plan rest positions so straight lines are clear.

## Verify (required)
Same as the original brief: a temporary preview page, `npx astro build`, a headless Chrome screenshot at 1440 and 390, **read every PNG**, then delete the preview page. Also shoot a **4× crop** of the busiest region: use sharp, already installed, to crop and resize the 1440 screenshot. Iterate until it passes the bar. Use your assigned port.

Commit per machine on your branch: `Add detail to the <name> plate.` plus a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Touch only `src/machines/<slug>/`.

## Report (under 120 words)
Per machine: part count before and after, what you added, and screenshot paths. Note anything you couldn't verify.
