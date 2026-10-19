# a6n.ai: design system (Oct 2026 revamp)

## Brief
- Subject: a6n, "(Ai)ny Management System". A small team in Singapore and India that builds the website, customer app, payments, messages and staff screen a small business runs on.
- Audience: owners of small businesses who don't know tech. No jargon.
- Job: get a call booked (mailto hi@a6n.ai).
- Assets: Michelangelo, public domain (Creation of Adam crop, Libyan Sibyl red chalk study), Anatomy plates and live anatomy-figures, fresco pigment palette.

## Jury baseline (before)
Blind critic 6.9 (Design 7, Usability 6, Creativity 8, Content 7). See `.jury/127.0.0.1-4400/critic.md`.
Biggest gaps: colour-only hovers, no skip link, nested-interactive, unstyled 404, no OG/canonical/sitemap, hero CTA on the fingertips, no page transition.

## Concepts
| | Idea | Anchor | Signature | O/F/Fe/P |
|---|---|---|---|---|
| A. Material: giornate | The site is a fresco laid one giornata (a day's patch of wet plaster) at a time: study, cartoon, patches, finished wall | the house style is already Michelangelo + fresco pigments; a6n builds a system piece by piece with the owner every week | the hero fresco paints itself patch by patch as you scroll, and your pointer is a wet brush | 5 / 5 / 4 / 1 |
| B. Name: the gap | (Ai)ny lives in the gap between Adam's finger and God's; every section closes one gap | the hero painting + the (Ai) pun | scroll pulls the two hands together | 3 / 4 / 4 / 4 (Creation of Adam is the stock "AI" image) |
| C. Formal: one atlas | Every section is a numbered plate in one anatomical atlas | the existing plates | an atlas index that flips plates | 3 / 4 / 5 / 3 |

First build picked A (giornate). Owner review (2026-10-19): the plaster wall, pounce dots and painted blob read as odd and too plain, and the fresco-making story was dropped. Owner chose a full-bleed painting with the split-hands moment (B).

## Concept card (current)
```
Idea:        a6n closes the gap between the parts of your business: everything finally in reach.
Metaphor:    the Creation of Adam, the two hands that almost touch.
Signature:   full-bleed Creation of Adam split down the finger gap. The halves start far apart with the headline in the open
             sky between them; scroll draws them together, warm light opens in the gap, a line appears, the view pushes through
             the gap into the page. OGL fragment shader (src/scripts/hands.ts) on the GSAP ticker.
Emotion:     a held breath, then contact.
Motion verb: reach and meet (things travel toward each other and settle; nothing drops in from nowhere).
Screenshot:  the two fingertips almost touching, light between them, the line above.
```
Idle: the halves breathe a hair and lean toward the pointer; the gap light pulses slowly. Reduced motion: the whole painting, still, headline over a soft wash.

## Palette (fresco pigments, named roles)
The concept is lime plaster and earth pigments, so this is warm plaster + red earth on purpose: it is the material, not the AI-default cream.
- ground `--page` intonaco #ece6da
- card `--card` fresh plaster #f6f2ea
- ink `--strong` lamp black #1b1714
- text `--text` #4a423b, muted `--muted` #645a50 (AA on ground)
- line `--faint` #d6cdbf
- accent `--sanguine` sinopia #a23f28 (CTAs, the brush, the gilt is ochre #c8902e)
- curtain arriccio #2a221d (view-transition plaster coat, footer finale)

## Type
- Display: EB Garamond 400/500 + italic (Renaissance book face), set huge, tracking -0.03em, leading 0.9.
- Text and UI: Switzer (Fontshare) 400/500/600.
- Labels: ui-monospace only inside plates (existing).

## Grid and rhythm
12 columns, gutter clamp(16px, 2.2vw, 40px), max 1320. Hang text from col 1 and col 7. Section moods: full viewport (hero), airy (statement), normal (plates), tight (FAQ), finale (dark arriccio footer).

## Shape
Radius: 0 for surfaces, 999px for pills only.

## Motion language
- Ease: expo.out for entrances, expo.inOut for scenes, power3.out for UI.
- Hovers: CTAs flood with sinopia from the pointer side (pigment soaking in). Nav: a brush-stroke underline draws. Client rows: their pigment floods the row from the left.
- Page transition: native cross-document View Transitions: a fresh coat of arriccio is troweled across (clip-path with an uneven edge) and lifted off the new page.
- Idle: the hero's wet edge breathes and the brush drifts very slightly (uTime). Off screen it stops; reduced motion shows the finished fresco.

## Composition
```
HERO (sticky stage, 380svh)          WHO (statement)                   PLATE II (system anatomy)
+--------------------------------+   +-----------------------------+   (existing plate + legend)
| a6n            nav     Book    |   | big serif paragraph, 9 cols |
| YOUR BUSINESS,                 |   |                    small    |   TRACKS / MESSAGES / PRESS
| working on its own.            |   |                    meta col |   (existing anatomy figures)
|        .:.:  [painted]  :.:.   |   +-----------------------------+
| chapter 1/4 text     scroll -> |                                     CLIENTS: index list rows
+--------------------------------+                                     FAQ, then dark finale footer
```

## Explainer figures
Plate II (system) stays the one explainer that owns a section; the other live anatomy figures stay as the house style, each tied to its section copy.

## Genericness test
- A generic model would centre a hero over the painting with a pill CTA: replaced by a full-bleed wall that the visitor paints.
- Cream + terracotta serif: kept on purpose, named by pigment, justified above.
- Fade-up on every section: replaced by SplitText line reveals only on display lines.
