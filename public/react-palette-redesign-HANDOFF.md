# React Palette Redesign — Handoff

## What this is
A preview page redesigning all **63 curated** names-attached-reaction icons for the
reactions palette. Production icons today are a mix of Noun Project / OpenMoji /
openclipart SVGs + a few PNGs + one Cloudinary hotlink, each with per-icon
opacity/saturate/scale/translate "fudge" filters. This redesign replaces them with one
original, consistent line-icon system.

Self-contained preview: **`public/react-palette-redesign.html`** (no app code touched).
Open it on the dev server at `/react-palette-redesign.html`. It has: side-by-side
old/new palette mockups (list + grid, faithful to the real popup), per-react comparison
cards (numbered), a dark-mode toggle, and an icon-strength slider.

## Design system
- 24×24 grid, 2px stroke, round caps/joins, **`currentColor`** — so it themes and
  dark-mode-inverts for free (no more `invert(1)`, no per-icon opacity/saturate/scale/
  translate fudges).
- Metaphors are preserved per-react; the redesign only changes the drawing style.
- The icon SVG bodies live in the **`new-icons` JSON block** inside the HTML (each value
  is the inner markup of an `<svg viewBox="0 0 24 24">`). Per-react labels, descriptions,
  old-image paths, old filters, and design notes live in the **`react-data` JSON block`**.
- Likelihood badges (`<1%`…`99+%`) are SVG `<text>` — outline them to paths before
  shipping so they're font-independent.
- Two icons are **filled** (fill-rule evenodd), not stroked: `changemind` and
  `changed-mind-on-point` — the iconic delta needs a variable-width (thick-bottom) edge.
  Everything else is stroked.

## Status (revisions 1–4 done)
All 63 read well at 24/40px and small sizes, in light + dark. The two long-time
holdouts were resolved in revision 4 (awaiting owner sign-off):
- **`thinking`** — pondering face + rising thought-dot trail (3 filled dots, growing,
  up-right; same accent-dot vocabulary as excitement/important). Face shrunk to r7.9
  and shifted down-left to make room. Dead ends, don't retry: hand-on-chin (beard at
  ~18px), full bubble outline (incongruent), face-only (read skeptical/odd).
- **`oops`** — facepalm rebuilt from the original PNG's *full* metaphor: tilted hand
  with scalloped fingertips over the eyes + thumb curl + grimace below + impact lines
  off the head (the shock is half the joke; earlier attempts dropped it). Dead ends:
  separate finger strokes (jail bars/visor), side-hand with occluded face arc (mush).

## How to visually verify — DO THIS, don't author SVG blind
Tooling: `sharp` (in node_modules) + Playwright chromium. NOTE: a sandbox recycle
wipes the chromium binary and its system libs — restore with
`npx playwright install chromium` then
`sudo dnf install -y nss nspr atk at-spi2-atk at-spi2-core cups-libs libdrm libxkbcommon libXcomposite libXdamage libXfixes libXrandr mesa-libgbm alsa-lib pango cairo fontconfig`.
- **Contact sheets:** parse the two JSON blocks out of the HTML, wrap each `new-icons`
  body in an `<svg>`, composite with `sharp`, write a PNG, and look at it. Render **both**
  large (~110px) and small (~15–20px, upscaled nearest-neighbor) — the small size is
  where expressions/metaphors break.
- **Live page:** `chromium.launch({args:['--no-sandbox']})`, goto
  `http://localhost:$PORT/react-palette-redesign.html`, screenshot light + dark (there's
  a `#darkToggle`).
- **Gotcha:** entity-escape `<` `>` `&` in any SVG `<text>` content — the literal `<` in
  "<1%" breaks HTML/SVG parsing and silently drops the text.

## Rollout (once the owner signs off on the set)
1. Export each icon to a standalone SVG under `public/reactionImages/v2/` (currentColor, 24×24).
2. Point the `svg:` fields in `packages/lesswrong/lib/voting/reactions.tsx` at the v2 paths.
3. Delete the per-icon `filter` fudges in `reactions.tsx`, and the `invert(1)` dark-mode
   branch in `packages/lesswrong/components/votes/ReactionIcon.tsx` (currentColor replaces
   it). The palette-wide dimming (`defaultFilter.opacity`, currently 0.4) becomes one
   shared value — owner suggested ~0.72.
4. Deprecated/uncurated reacts can keep old art or be redrawn as a follow-up.

## Relevant files
- `packages/lesswrong/lib/voting/reactions.tsx` — react list, `svg:` paths, filters, `defaultFilter`
- `packages/lesswrong/lib/voting/curatedReactionsList.ts` — palette sections + ordering
- `packages/lesswrong/components/votes/ReactionIcon.tsx` — the renderer (filters, dark-mode invert)
- `packages/lesswrong/components/votes/ReactionsPalette.tsx` — the palette UI
- `public/reactionImages/sources.txt` — attribution list for the current (to-be-replaced) art
