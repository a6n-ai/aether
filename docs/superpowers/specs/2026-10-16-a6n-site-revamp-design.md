# a6n.ai revamp: design

Date: 2026-10-16. Repo: `aether` (Aether is only the GitHub project name; the brand is **a6n**).

## Intent

Rebuild a6n.ai for **small business owners who don't know tech**. They should leave knowing, in plain words, what a6n builds for businesses like theirs, see real working examples, and **book a call**.

The look fuses two sources:
- **Anatomy** (skills.wheresryan.sh/anatomy): calm paper page, monochrome isometric machines, tiny engraved labels outside the drawing, numbered plates, first-person plain copy. "The object is the explanation."
- **Michelangelo**: real public-domain painting crops (Creation of Adam, Sistine ceiling) for heroes and section openers, plus a red-chalk (sanguine) study style used as the single accent.

## Goals

1. A non-tech owner understands "what a6n does for me" within one screen, with no jargon.
2. Every product in the catalog appears with equal weight, explained by an Anatomy machine.
3. Each page leads to one action: **Book a call**.
4. It's fast on a phone: static Astro, lazily loaded and compressed images.

## Non-goals

- No pricing on the site (none verified).
- No sign-up, login, or customer accounts.
- No blog or CMS.

## Anti-goals (fail even if it works)

- **Jargon.** Never use API, LLM, agentic, platform, SaaS, stack, integration, backend, or webhook. Say "your own ordering website", not "white-label storefront".
- **Generic AI look.** No purple gradients, glowing orbs, robots, or neural-net imagery.
- **Museum-stuffy.** Art supports the business message and never buries it. Every painting crop sits next to a plain sentence about the visitor's business.
- **Slow or heavy.** Phone LCP under 2.5s. Paintings ship as AVIF/WebP, sized per viewport, lazy below the fold.
- **Overpromising.** Show only features marked *Live* in the catalog. Never show *Partly built* or *Not yet* items as available.

## Constraints (decided)

- Keep **Astro + GitHub Pages at a6n.ai** (existing `.github/workflows/deploy.yml`, `public/CNAME`). Keep `gsap` and add no new frameworks.
- **Keep the three-ring mark** (`src/components/Mark.astro`). Replace everything else: delete the comic strip components and the cyanotype styles.
- **All diagrams are made with the Anatomy skill** (`~/.claude/skills/anatomy`, `kit/iso-kit.ts`, `kit/iso.css`): isometric, solid faces, four shade tones, one lit part, labels outside the drawing, and reduced-motion still frames.
- Ship **ASAP, in phases**. Home goes first.
- Pages: **Home, What we build, How it works, About + Contact**.

## Visual system

Tokens come from Anatomy's light theme. A dark theme is optional, using Anatomy's dark tokens.

| Token | Value | Use |
|---|---|---|
| page | `#f2f2ef` | background |
| card / paper | `#fbfbfa` | plates, cards |
| strong | `#18181a` | headings |
| text | `#57575a` | body |
| muted | `#8c8c90` | labels, captions |
| faint | `#d4d4d6` | hairlines |
| **sanguine** | `#b5523b` (red chalk) | CTA, links |

**Fresco palette (owner's choice: colored diagrams).** These override Anatomy's monochrome default. Each product owns one Sistine pigment, and color means "this product". Each machine uses its hue across all its parts, shaded in Anatomy's four face tones (`color-mix` of the hue with paper or ink). Every color is a token.

| Product | Pigment | Hex |
|---|---|---|
| TiffinGrab | ochre | `#c8902e` |
| Puchkaman | verdigris | `#4f8a6e` |
| Xplorers | lapis | `#2f5d9e` |
| Copper + Cloves | sanguine | `#b5523b` |
| Relay | violet umber | `#6b4f7a` |
| Foundry / How it works | raw umber | `#7a5c3e` |

Sanguine is also the site's CTA and link accent.

**WebGL (owner's choice: hero and inside machines).** Follow `~/.claude/skills/anatomy/references/webgl.md` (layer stack, camera contract, section 8 light-theme inks, and "nothing pops, nothing is cut") and use the `raptor-engine` and `ripple-tank` examples as models.
- Hero: soft light drifting across the Creation of Adam gap. The painting is the back layer and the shader only adds light.
- In machines, a shader is used only for things lines can't draw: kitchen steam (TiffinGrab), light travelling through the tube (Relay), forge glow (Foundry). Solids always stay SVG.
- Performance: each canvas starts only when it's in view and pauses off-screen. The SVG fallback looks the same without WebGL and under reduced motion. WebGL must not push phone LCP past 2.5s, so the hero shader starts after first paint.

Type: **EB Garamond** for display (the Renaissance voice), **Inter** for body and UI, `ui-monospace` for plate labels ("PLATE III · TIFFINGRAB"). These match Anatomy's own pairing.

Paintings: public-domain Wikimedia Commons scans, cropped tight and desaturated slightly toward paper so they sit inside the palette. Captions credit them, for example "Michelangelo, *The Creation of Adam*, c. 1512".

Motion follows the Anatomy rules plus Apple-style restraint. Machines run an idle loop, pause on hover/focus, stop off-screen, and show a still frame under `prefers-reduced-motion`. There's one entrance per view and no scroll-jacking.

## Big idea: "The touch"

The Creation of Adam hands, nearly touching, are the site's motif. **The gap between the fingers is the space between your business and the tool it needs.** a6n closes that gap. The hero is the hands crop. The headline is "Your business, *working on its own*." (wording is the builder's to refine, within the jargon rules). The CTA sits in the gap.

Every product is a **plate**: an Anatomy machine whose moving parts *are* the customer's day, with the steps taken from the catalog's numbered flows.

| Product (catalog) | For | Machine (Anatomy) |
|---|---|---|
| TiffinGrab | meal-plan / tiffin kitchens | stacked tiffin carrier on a conveyor: plan in, labelled tins, delivery van out |
| Puchkaman | restaurants on a Clover till | till and website joined by one belt: the menu flows out, orders flow back |
| Xplorers | clubs and classes | a seat-board calendar: seats flip to "booked", payment stamp |
| Copper + Cloves | boutique studios | a turnstile with a pass card, a QR gate, and cafe/shop drawers |
| Relay | anyone messaging customers | pneumatic tube post: a message capsule goes in, retries, arrives |
| Foundry | custom builds | a workbench of ready-made parts that snap into a new machine |

Products are labelled by **what the owner does**, with the brand name second. For example: "Sell weekly meal plans. *TiffinGrab*".

### Diagrams must read for the general public

The person reading these has never seen a system diagram.
- **Everyday objects only:** tins, vans, tills, turnstiles, tubes, workbenches. No boxes, arrows, servers, or clouds.
- **One idea per machine.** If it needs a legend, it's too complex.
- **Plain labels of 1–3 words**, written as what happens ("order arrives", "seat taken") and never as parts ("webhook").
- **One sentence under each machine** says the same thing in words. Example: "Your customer picks meals, your kitchen gets the list, your driver gets the route."
- Motion shows the story **in order** (step 1 lights, then step 2), and the reader can scrub or step through it.
- **Five-second test:** a non-tech person can retell the plate after one look. Each machine is checked against this before it ships.

### Diagram sourcing (user rule: every diagram goes through Anatomy)

Climb this ladder for each machine:
1. **Reuse** an existing Anatomy piece if it already tells the story (local `~/.claude/skills/anatomy/examples/*`, or the online collection at skills.wheresryan.sh/anatomy/collection/*). Re-skin it to our tokens and rename its parts in plain words.
2. **Adapt** the closest one, keeping its mechanism and swapping the parts.
3. **Build from scratch** with `/anatomy` and the kit (`kit/iso-kit.ts`, `iso.css`).

| Machine | Start from | Rung |
|---|---|---|
| Relay (message tube post) | collection `message-queue` | adapt |
| Puchkaman (till ⇄ website belt) | collection `tcp-handshake` (two sides agreeing) | adapt |
| Xplorers (seat board) | collection `mutex` (one seat, one holder) | adapt |
| Copper + Cloves (pass turnstile) | examples `turning-dial` / `dial-indicator` (credits counting down) | adapt |
| Foundry (workbench of parts) | examples `desk-computer`, `test-rig` | adapt |
| TiffinGrab (tiffin conveyor) | none fits; take inspiration from the `watch` / `turbofan` gearing | from scratch |
| How it works (build process) | examples `test-rig` staging | adapt |

Collection pieces are only *reference* until their source is confirmed reusable (local examples are MIT). If a piece's source isn't available, rebuild it from scratch in the same spirit.

## Pages

**Home**
1. Hero: Creation hands, a plain headline, one-line subhead, **Book a call**.
2. "Who we help": four owner types (food subscription, restaurant, classes, studio), each linking to its plate.
3. One featured machine (Realm/Foundry: "a new app built from working parts, not from zero").
4. Closing CTA under a Sistine ceiling crop.

**What we build**: all six products as **equal plates** in one grid/sequence. Each plate has the machine, a one-line "what it does for you", 4–6 *Live* features in plain words, where it runs, and a CTA. Source: the catalog artifact (status as of 12 Oct 2026).

**How it works**: the "build process" as one big Anatomy machine with a few stages (talk → we assemble from working parts → your app goes live → we keep it running). It also explains Realm, Foundry, and Relay as "one workshop, shared parts" without those words being jargon.

**About + Contact**: a short first-person story, the team, the mark, and a booking embed or link.

## Content rules

- Grade-6 reading level. Use short sentences and second person ("your kitchen", "your customers").
- Write numbers only when they're verified.
- Every diagram has an `aria-label` that tells the same story in words.

## Left to the builder

- Final headline and section copy, inside the rules above.
- Exact painting crops (Commons sources).
- Grid layout of the plates, the nav pattern, and footer details.
- Whether dark mode ships in phase 1. Default: light only.

## Phasing

1. Tokens, layout, fonts, and Home with the hero and one machine. Deploy.
2. What we build: all six plates.
3. How it works, then About + Contact.
4. Polish pass with impeccable, apple-design, and ui-ux-pro-max audits, plus Lighthouse on mobile.

## Settled for the builder

- **Catalog source:** https://claude.ai/artifact/3R3BazMrCXjS6aj8cwD3sZ (status read 12 Oct 2026). Use only rows marked `L` (Live). Copy the flows and "where" from it.
- **Realm** is the catalog's name for the one system that runs a separate branded app per client (TiffinGrab, Puchkaman, Xplorers). It's built from Foundry parts and sends messages through Relay. On the site it becomes "one workshop, shared parts", and the word Realm can appear once at most. Home's featured machine is the Foundry workbench.
- *(my call)* Anatomy machines run as small client scripts inside Astro components. They ship a static SVG first frame for no-JS users and reduced motion. gsap is used only for page-level reveals, never inside machines.
- *(my call)* Paintings are downloaded from Wikimedia Commons into `src/assets/art/` and served through `astro:assets` (AVIF/WebP, responsive). The hands crop is cut so the gap sits at center. On mobile the crop stacks vertically with the CTA below the fingertips.
- *(my call)* Fonts are self-hosted through Astro's built-in fonts API with `font-display: swap`.
- *(my call)* Phase gate: Lighthouse mobile Performance and Accessibility ≥ 90, no console errors, and nav shows only built pages.

- **Book a call** is `mailto:hi@a6n.ai?subject=Book%20a%20call` (the address the current site already uses), with a prefilled body that asks the visitor about their business and a good time to talk.
- **About:** the builder drafts a short first-person story with no names or photos, and the owner edits it.
- **Proof** (logos, testimonials, numbers) is **out of scope for now**, per the owner.

## Addendum, 2026-10-16: owner changes after Phase 1

The owner's answers in chat:
- **Positioning block** in plain words, inspired by 360labs.ai's intro (not copied). a6n works mainly from **Singapore and India** and builds for businesses worldwide. "Not a vendor, more like your own tech team."
- **Home FAQ** with 8–10 plain questions as an accordion (360labs pattern). Answers carry no unverified numbers or prices.
- **Clients get their own pages** at `/clients/<slug>`. Home shows clickable client cards.
- **Processes, both kinds:** "Ways to work with us" tracks on home (Build new, Move you over, Run and grow), and the detailed build process on a How it works page.
- **Every section gets an Anatomy plate**, a machine with real items on it, the way the workshop has.

Pigments: a6n's own machines use **raw umber** with a sanguine lit part. Relay uses **violet umber** `#6b4f7a`. Each client machine uses its client pigment (TiffinGrab ochre, Puchkaman verdigris, Xplorers lapis, Copper + Cloves sanguine).

| Plate | Where | Story, four steps (labels) |
|---|---|---|
| In-house team | home, Who we are | your shop · our bench inside it · fixed on the spot · one team, yours |
| Build new | home, tracks | your idea · drawn up · built from parts · open for customers |
| Move you over | home, tracks | paper and spreadsheets · fed in · sorted into your app · nothing lost |
| Run and grow | home, tracks | your app running · checked every day · fixed and improved · grows with you |
| Relay | home, Messages | you send a message · kept safe · tried again if needed · it arrives |
| TiffinGrab | client page | customer picks meals · kitchen packs · labelled tins · driver delivers |
| Puchkaman | client page | menu on your till · same menu online · customer orders and pays · order lands on the till |
| Xplorers | client page | classes on the board · family picks a seat · pays · seat booked |
| Copper + Cloves | client page | member buys a pass · books a class · scans at the door · class, cafe and shop |
| Build process | How it works | we talk · we plan · built from parts · goes live · kept running (5 steps) |
