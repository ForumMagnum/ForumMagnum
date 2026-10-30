# Experiment 3 handoff: from the Studio session to the MacBook session

Written Oct 29 2026, about 3:15am PT, by the Mac Studio session "Lw variable widget width (studio)" for the
MacBook session "LW Variable Widget Width". It covers everything that session knew: what Ronny asked, what
was built and why, what every group of subagents did and found, how to run and check it, and what is open.
Read REPORT.md (same folder) for the Ronny-facing write-up; this file is the engineer-facing one.

## 0. Get everything onto the MacBook

1. `cd "<your ForumMagnum checkout>" && git fetch origin experiment/iframe-layout-ronny-exp3 && git checkout experiment/iframe-layout-ronny-exp3`
   (tip `9667c1586f` or later; never merge or rebase master into it).
2. Pull the Studio's scratch work (not in git: agent scratch, screenshots, my session transcript):
   `scp studio:~/lw-exp3-handoff.tar.gz ~/ && mkdir -p ~/lw-exp3-handoff && tar -xzf ~/lw-exp3-handoff.tar.gz -C ~/lw-exp3-handoff`
   Contents are listed in section 9.
3. The brief this work followed is `~/.claude/briefs/lw-widget-exp3/BRIEF.md` (you wrote it; a copy is in the
   tarball). Its rules still hold (section 8).

## 1. Status

- Done: inventory, decisions, implementation (editor + post), second demo post, checks, deploy, REPORT.md.
- Live (Vercel project `lw-experiment-widget-blocks-c4b9cuhv8val44y0`, alias below always serves the latest
  READY deployment):
  - Content blocks post: https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/blocks (and `/blocks/editor`)
  - AI Futures post with Exp 3 rules: https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e (and `/editor`)
  - Last deployment: `dpl_4rGcPLtu5WxgJG4ZxVnkjkhGe2Xw` (commit 9667c1586f), started 3:05am; the one before
    (`dpl_DFpM7sSeshJ6XmrbyRTzbu45uBDr`, commit 3a8eb637ce) was READY and is what Ronny first looked at.
    Ronny said not to verify the live build ("just let me look at it"), so the live site was not checked
    beyond a curl that the alias serves the new demo HTML.
- Ronny has 2 open questions (REPORT.md "Needs you"): Safari test (needs `npx playwright install webkit`, a
  download: ask him first); quotes/sections/lists beside a RIGHT widget flow like text (my call) vs one rule
  for both sides. (Opposite-side widgets: answered Oct 29, never level: see "No two widgets at one height"
  in section 11.)
- Dev server on the Studio: stopped. Nothing else running there.

Commits on the branch since Exp 2's tip 6a5a86cf1c (oldest first):
d50f33cb57 route + post switch scaffolding + check overrides; 20a404aad2 editor column = post column,
second post scaffolding; 734d8f38c0 one wrap rule at every width + prototype harness; f61a3ddd27 state
notes; c227dd4b6c the implementation; 3a8eb637ce fixes from the checks + report draft; 30c1d0dbe9 report
links; 9667c1586f fixes from the code review.

## 2. Ronny's request and what it became

His words (Oct 28, 5:30pm PT): go through every kind of content block in the editor, list them, plan how
each should interact with partial-width widgets, test each way, make sure it looks good, implement it, tell
him each choice and its full behavior, every behavior must work at every screen width, don't force an
interaction where none makes sense, make a second demo post that demonstrates each behavior, openable in
this demo, push to a new URL "experiment 3".

The answer in four rules (all scoped to blocks after, or holding, a floated widget, so posts without one
are unchanged):

| Behavior | Blocks |
|---|---|
| flows beside (text) | paragraphs and inline content, AI content |
| box beside, else below (display: flow-root; min-width min(296px, 100%)) | headings h1-h6, spoilers, legacy conditionally-visible blocks, legacy figure.table; beside a LEFT widget only: blockquotes, collapsible sections (.detailsBlock), list items |
| beside only if it fits at its own size (calc-size min-width), else below | code blocks and pre, tables, images (own size), display equations |
| clears below (clear: both) | hr, every embed, the footnotes section, the post's scroll box (HorizScrollBlock) |

Plus the sliver guard (JS): a box beside a widget goes below it when it would sit beside only the widget's
last 48px or bottom margin, or (not list items) when more of it would hang below the widget than sit beside it.

## 3. The code (where everything lives)

All paths under `packages/lesswrong/`.

- `components/contents/widgetNeighbours.ts` (new): THE rule table. Each rule has `postAfter`/`editorAfter`
  (selectors prefixed with `POST_FLOAT ~ ` = `.iframe-widget:has(> .lwFloatedWidget) ~ ` or `EDITOR_FLOAT ~ ` =
  `.iframe-widget-code[data-lw-wraps] ~ `) and/or whole `post`/`editor` selectors, plus JSS declarations.
  `widgetNeighbourGlobals('post' | 'editor')` turns it into a JSS '@global' object; rules with the same
  selector merge, `fallbacks` merged deeply (a code-review fix). `EDITOR_CLEARING_BLOCKS` (hr + embeds) is
  used by the drag. To change a behavior, change it here: both views follow.
  Left-only rules use `[data-lw-side="left"]`, set on the post's floated iframe (HydratedIframeWidget) and
  the editor's spacer (placeSpacer). Known limit: `~` means "after ANY earlier left widget".
- `components/contents/widgetSliverGuard.ts` (new): `guardSlivers(root)` / `scheduleSliverGuard(root)`
  (rAF-debounced per root; waits while `body.lw-widget-dragging`, rechecking every frame). Marks only the
  root's own children and the direct items of its top-level lists (`OWN_MARKS`), skips the block a
  bottom-aligned widget lines up with, fires `WIDGET_LAYOUT_EVENT` ('lw-widget-layout') on the root when the
  set of marks changed. `mayRealignAfterGuard(root, event, realignLater)` rate-limits realignment to 4 events
  a second (each event counted once) with one trailing realign a second later. `widgetContainerWidth(column)`:
  a container's content width; 0 inside td/th/footnotes/layout columns (= never wraps).
- `components/contents/bottomAlign.ts`: `alignFloatBottom` now (a) returns 0 for a heading, a block whose
  computed clear isn't none, or a block whose content (first text line or media, `contentTop`) starts at or
  below the widget's bottom (this fixed the runaway push of thousands of px); (b) bails out with 0 if the
  block's top moves with the push; (c) searches jump-then-bisect between the largest push known to fit and
  the smallest known not to (fixed drag-check B1, where a whole line moving up made the old loop stop
  short); (d) sets `data-lw-pushed` when push > 0 (clearFloatBottom and placeSpacer remove it).
- `components/contents/HydratedIframeWidget.tsx` (post): '@global' = `widgetNeighbourGlobals('post')` (the
  old h1/h2 clear rule is gone); floats are `position: relative; z-index: 1` (AI content and positioned
  embeds painted over the widget and took its clicks); centered widgets `clear: both`; `data-lw-side`;
  `useColumnWidth` measures `widgetContainerWidth(parent)`; a layout effect schedules the guard on the
  column and on a ResizeObserver; bottom alignment also realigns on WIDGET_LAYOUT_EVENT.
- `components/contents/ContentItemBody.tsx`: a widget nested in a quote/list/collapsible/AI block now renders
  (`hydratedWidget` flag; before, the placeholder had no children and the widget was dropped).
- `components/lexical/embeds/IframeWidgetEmbed/IframeWidgetPlugin.tsx` (editor): '@global' spreads
  `widgetNeighbourGlobals('editor')` (old h1-h3 clear and the drag-page-only footnote clear removed);
  `placeSpacer` sets `data-lw-side`, removes `data-lw-pushed`, gives a centered widget (hand-written meta,
  window >= 600, column > 0) its width in a row of its own; `applyPreviewModeToDOM` sizes a nested widget
  against its container and schedules the guard; both position trackers re-measure on WIDGET_LAYOUT_EVENT;
  a new effect realigns bottom-aligned widgets on it; the update listener schedules the guard.
- Drag: `widgetDragDom.ts` measureBlocks gives kinds 'divider'/'embed' and `clears` from
  `EDITOR_CLEARING_BLOCKS` (they only clear once a float precedes them, so computed style can't be used) and
  ignores guard marks; `widgetDragGeometry.ts`: headings no longer snap (`snapped` replaced
  `headingSnapped`; `snappedBelow`/`pushesDown` are `ClearingKind` = divider | embed | widget; chips "Below the
  divider", "pushes the embed down"); a widget still never bottom-aligns with a heading (kind check);
  `WidgetDragLayer.tsx` exposes `data-snapped` (was data-heading-snapped).
- Editor-wide fixes (affect every editor, all improvements): `components/lexical/Editor.tsx` editor
  `minWidth: 0` (wide code/equations widened the column up to 50px, so widgets wrapped where the post shows
  them full width); `components/lexical/nodes/ImageComponent.tsx` applies a resized image's width in a ref
  callback (the effect ran before the Suspense-loaded image existed, so resized images showed full width
  until clicked); `components/editor/lexicalPlugins/footnotes/FootnoteSidenotesPlugin.tsx` side notes show a
  stand-in line for a widget in a footnote (they copied the spacer's source code).
- Stable class names added for the rules: `spoiler-block` (SpoilerBlock), `horiz-scroll-block` +
  `horiz-scroll-block-contents` (HorizScrollBlock), `lw-image-container` (editor ImageComponent).
- Editor caret sentinels are out of the flow (`.sentinel-paragraph { position: absolute; left: 0; right: 0 }`
  in Editor.tsx, Oct 29): in the flow, their empty line box stopped the margins on either side collapsing,
  so the editor's gaps around spoilers, equations, embeds, collapsible sections, headings, the footnotes and
  every top-level widget were up to ~1em taller than the post's. That replaced three narrower fixes (two of
  LessWrong's collapsible-section margin rules in Editor.tsx, and the rule table's `EDITOR_FLOAT +
  .sentinel-paragraph + :not(h1..h6) { margin-top: 0 }`). Out of the flow a sentinel no longer narrows
  beside a widget, so `narrowCaretLines` (widgetSliverGuard.ts, run with the sliver guard, and again when
  the caret moves into a sentinel) sets its left or right to the widget's margin edge: the caret line spans
  only the text beside a widget, as before (`data-lw-beside` marks one it narrowed).
- Post body ends below its last widget: `:has(> .iframe-widget > .lwFloatedWidget)::after` clearfix.
- Demo plumbing: `components/posts/PostsPage/widgetBlocksDemo.ts` (paths, titles, storage keys; the blocks
  post opens in Exp 3 mode always, the AI Futures post only with `?widgetBlocks=ai-futures`);
  `WidgetDragPostBody.tsx` (`useWidgetBlocksContent`, `WidgetBlocksPostBody`, `renderMathForReader`: the Post
  tab renders `\[..\]`/`\(..\)` with the editor's MathJax loader, since published posts get MathJax at save
  time); `LayoutDemoTabs.tsx` (`WidgetBlocksDemoBar`); `LayoutDemoEditor.tsx` (`blocksDemo` prop); `LayoutLab.tsx`;
  `PostsPage.tsx`; routes under `app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/` (route, editor,
  default-post, and the same under blocks/); `server/layoutDemo/blocksDemoHtml.ts` (`<!--demo:side width hN
  [bottom]-->` plain demo widgets and `<!--widget:name ...-->` AI Futures widgets) and `blocksLayoutDemo.ts`
  (`ensureBlocksDemoPost`: finds the unlisted post by title "How content blocks behave next to widgets",
  updates it when the HTML fingerprint in the revision's commitMessage differs). Local DB post id
  `mdbqCn5Daji5kdYbb` (shared dev DB, so the same everywhere). Note: two servers serving different demo
  HTML will keep rewriting that post's revision; harmless, the Post tab renders from `/default-post`.
- Demo content: `experiments/iframe-layout/content-blocks/demo/blocksDemoSource.ts` (String.raw template; 10
  sections; demo widgets just say "Demo widget": the editor strips the lw-layout meta from the srcdoc it
  previews, so a widget can't read its own placement there).
- Unit tests: `unitTests/iframeWidgetDragGeometry.tests.ts` (47 pass): heading tests rewritten to dividers and
  embeds, plus "a widget that wraps sits right before a heading, never lines up with one".

## 4. Every decision, with the runner-up and the reason

(Designer pick, judges' verdicts, and my final call. Full designer/judge JSON: `design-results.json` in this
folder; their CSS/specimens: tarball `lw-exp3-proto/design/<group>/`.)

- Headings: designer D "flow-root beside, min 300" over A all-clear (Exp 2: holes beside the widget 100 to
  250px whenever a section is shorter than it; runaway bottom-align), B major-clear, C flow (long headings
  wrap around the widget's corner). Judges agreed; asked for a sliver rule and no bottom-align to headings
  (both done) and a 296px floor (done, all boxes).
- Lists: designer D "li display: flow-root list-item" (B whole-list box stays narrow; C markers outside the
  box; H Chrome ignores box margins beside floats). Both judges said left-only; I did left-only. Limit: two-
  digit numbers ~5px from the widget, three-digit would touch it.
- Quotes: designer B box beside both sides; reader judge disagreed (left-only + "mostly below" fallback);
  author judge agreed with B + overflow-x. I saw long quotes narrow for hundreds of px below a RIGHT widget
  and went left-only, plus the general "hangs below more than beside" guard. Dialogue sections: no interaction.
- Collapsible + spoilers: designer B box beside, else below. Reader judge: collapsibles left-only (done),
  spoilers both sides (done). Fixed in the post: hidden spoiler's black bar drawn over the widget. Reader
  collapsibles start closed (LW behavior); a widget inside hides with the section.
- Code: designer D "beside only if every line fits" (calc-size max-content); A/B scroll beside (truncates
  code), C always clear (holes). Judges agreed; floor folded in. Safari/Firefox fallback: 296px floor, long
  lines scroll beside.
- Tables: designer B + sliver guard (box filling the room if the narrowest layout fits). Reader judge wanted
  a proportional guard and the scroll wrapper as the box; I used the general guard and made the post's scroll
  box clear (it only exists for content wider than the column). Widget in a cell: full cell width.
  IMPORTANT bug I hit: never give a <table> display: flow-root (breaks table layout); `fitOrBelow(size, null)`.
- Images: designer C "beside if it fits at its own size, else below, centered in the room" (B blank strip and
  reader runaway; D overrides author size; A editor/post disagree). Judges agreed with 3-4 fixes (bottomAlign
  content-top check: done; editor container inline: done via `lw-image-container`).
- Math: designer's final.css "box beside if the whole equation fits" (the math designer never returned its
  structured result; I read its final.css and guard.js). Editor: `div.math-tex > .horiz-scroll-block` fit-or-
  below; post: plain display equations already center in the line beside or drop below; scroll box clears.
  Not done from its notes: the editor's extra margins around display math (`.math-display` margin-block 0).
- Dividers: clears below (hr) + page-break band narrows; judges agreed; drag kind 'divider' done.
- Embeds: clears below for every embed (C beside: Metaculus phone layout, Calendly strip, half-size video);
  judges agreed. Editor selector matches decorator blocks holding embed iframes; YouTube editor parity CSS
  from the designer (fixed 560px iframe) NOT shipped.
- Footnotes: clears below (editor already, post now); widget in a footnote full width; side-note stand-in.
- Columns: clears below "once columns are turned on". Columns have no UI and saved columns import as
  paragraphs (LayoutContainerNode importDOM reads computed style from a DOMParser doc). Not built; noted.
- LLM/AI content: designer B flows beside, label rides with the text; 4 rules (z-index, label inline when the
  block doesn't start with a p, label after a pushed left widget, widget inside contained). Judges: rule 4 as
  clearfix/flow-root without min-width (done as flow-root).
- Widgets/text/inline: designer "own row": opposite-side floats clear both (stack), centered widgets own row
  at their width, sentinel fixes, scroll-arrow wrapper beside. I kept opposite sides LEVEL (Exp 2 behavior
  Ronny saw, with the warning chip) and put it to Ronny; did the centered and sentinel parts.

## 5. What each group of agents did

- Inventory workflow (run wf_5c287e65-678; 19 agents; 3.9M tokens; ~100 min): 6 survey lenses (Lexical
  node registry, author insert menus and shortcuts, markdown/paste/HTML import incl. legacy CKEditor HTML,
  reader CSS and ContentItemBody, embeds and media, containers that can hold blocks) produced 203 raw
  entries; a merge agent deduplicated them; 3 rounds of completeness critics reported 9+4+5 missing blocks
  and 26+32+24 corrections, each round re-merged; result 72 blocks with editorDom, savedHtml, readerRender, layoutFacts, pointers.
  `inventory.json` (committed). Its cross-cutting notes are in `inventory.json` "notes": nested widgets never
  rendered in the post; sentinel vertical drift; positioned neighbours paint over floats; non-BFC boxes under
  floats; BFC boxes narrowing; boxes that act like clears; every clearing block made align=bottom run away;
  published HTML depends on the export path (client save, pending suggestions, typo-bot publish, autosave).
- Design workflow (run wf_0f156119-c50, script in tarball): 14 designers (one per group) each wrote a
  specimen, rendered the baseline and 2-4 candidates in the real editor and Post tab at 15 widths via
  `tools/proto-render.mjs`, and picked one; 2 judges per group (reader lens, author/robustness lens) re-
  rendered and attacked each pick; revisions ran for groups with objections. I stopped the workflow at
  ~1:15am once the decisions were folded in: math's designer and most revisions never returned structured
  results (only revise:footnotes did), but their files (final-v2.css etc.) are in the tarball. ~53,000
  screenshot files; the 122 key screenshots they cited are in the tarball.
- Code review agent (after implementation): found 5 bugs, all fixed in 9667c1586f: table fallbacks
  overwritten (shallow merge), guard clearing nested containers' marks, editor leaving data-lw-pushed,
  centered widget 0px in a cell, realign dropped after the rate limit. Also confirmed: bisection terminates
  and returns the largest fitting push; no synchronous event recursion; listeners cleaned up; data-lw-below
  doesn't leak into saved HTML (Lexical builds export from nodes).

## 6. Checks and tools

- `experiments/iframe-layout/content-blocks/width-sweep.mjs`: opens a demo's Editor and Post tabs side by
  side, steps the window (default every 8px, 320-2560), and checks overlaps (text, bordered/backgrounded
  boxes, media, list markers vs floated widget boxes; containers holding a widget and closed collapsibles
  excluded; equations measured by mjx-math), sideways scroll, wrap counts, and per-block agreement (x, width,
  first-line x, matched by text; "drift" = differences within 40px of a widget's bottom). Options: `--demo
  blocks|ai-futures --from --to --step --specimen --css --engine chromium|webkit --out`. Last result: 0
  problems, 0 drift at every 40px. The every-8px run was NOT done.
- drag-check / new-features-check (`experiments/iframe-layout/widget-drag/`): `EDITOR_PATH`, `POST_PATH`,
  `PW_CHROMIUM`, `ONLY=main,bottom,narrow,...`. Final: Exp 3 editor 143/143 (full run), Exp 2 editor 142/143
  with the miss (S8 overlay timing) fixed afterwards and main 54/54 since; new-features all pass on both.
  Deliberate changes: S3 (float lands right before a heading; full-width lands before the heading or before
  the float at its top), E1 (float before a heading runs on beside it; opposite float warns), S5 (aims below
  every widget at the end of the post, because the AI Futures post's last section now runs beside widgets).
- `experiments/iframe-layout/content-blocks/tools/`: `proto-render.mjs` (render any specimen HTML in the real
  editor + Post tab via the edits key `lwWidgetBlocksEdits:blocks`, in sessionStorage since Oct 29, with
  `?specimen` on the editor URL, the only case where the editor opens on stored edits; inject CSS, per-section
  screenshots + overlap metrics), `widget.mjs`, `with-slot.sh` (4 browser slots; on the MacBook drop it or
  point PW_CHROMIUM at Chrome). `columns-check.mjs` (editor vs post column widths).
- Tarball `lw-exp3-proto/impl/`: `gen-css.mjs` (prints the CSS the rule table makes, via esbuild + JSS),
  `demo-shots.mjs` (screen-by-screen shots; headless Chrome doesn't paint off-screen iframes into full-page
  shots), `sheet.py` (editor | post contact sheets), `probe-guard.mjs`, `probe-dom.mjs`, `diag*.mjs` (reload-
  loop and console diagnosis), `run-checks.sh` (both checks on both editors).
- tsc: `yarn tsc` (tsgo) 0 errors. Lint: clean on changed files. Unit: `yarn unit packages/lesswrong/unitTests/iframeWidgetDragGeometry.tests.ts`.

## 7. Gotchas learned on the Studio

- The dev server sometimes falls into a reload loop after a restart (every page reloads several times a
  second; "Compiled in ~20ms" repeats in the log). Restart again (wait ~20s before the first page load) and
  kill leftover headless Chrome. It also happened when route files were edited during a check run.
- Restart the dev server after any JSS/defineStyles change (widgetNeighbours.ts included); plain .ts logic
  hot-reloads on the next page load.
- `tsconfig.tsbuildinfo` can hide a new route's type: delete it. Never name a zsh variable `path`.
- On the post page `[data-lexical-editor]` also matches the comment box: scope probes to
  `[data-testid=widget-drag-post-body]`.
- Lexical drops HTML it can't import; resized images import their width from `figure[style*="width:N%"]`.
- The bottom bar (`[data-lw-bottom-bar]`) covers content in screenshots; hide it.

## 8. Rules (from the brief, still binding)

Push only `git push origin experiment/iframe-layout-ronny-exp3` (pre-push hook refuses others; never
--no-verify). Never push/deploy exp2, mvp1, claude-v1 or the base branch or their Vercel projects; no PRs.
Never change existing posts in the shared DB. Never edit `experiments/iframe-layout/ai-futures-model/`,
`buildLayoutDemoPostHtml`, `LAYOUT_DEMO_TITLE`, `ensureLayoutDemoPost`. No master merges/rebases. No `crons`
in vercel.json. `SKIP_VERCEL_CODE_PULL=true` always; never bare `vercel`, `vercel link`, `vercel env pull` in
the repo. Never print or commit secrets (.env.local; the Studio's env backup stays there). Never open the
dev server's home page (jams the DB pool). Widgets fully clear. No em dashes in anything Ronny reads. Commit
messages start with `EXPERIMENT:` and end with the Co-Authored-By line. Headless, muted browsers, always
closed. At most ~20 committed screenshots, each under ~300KB. The Exp 2 route on this branch shares the
code, so it shows Exp 3 behavior locally; Exp 2's live deployment is frozen and unchanged.
Deploy: on the Studio `cd ~/.claude/briefs/lw-widget-exp3 && python3 make-project.py unused deploy` then
`... status <dpl_id>` (it refuses any other project/branch; a copy is in the tarball; from the MacBook you
can run it over `ssh studio`, or use your own copy).

**Two local copies (Ronny, Oct 29 2026), so he can use the site while work goes on:**
- Ronny's play copy: worktree `~/Github Repos/ForumMagnum-layout-play`, detached at a commit that passed
  every check, served on port 3000 (launch.json `lw-layout`; his tabs and Google login are on 3000). Never
  edit it, push from it, restart it or run tests against it during normal work.
- The working copy: `~/Github Repos/ForumMagnum-layout` (this branch) on port 3001 (launch.json
  `lw-layout-work`, debugger on 9230 because the play copy holds 9229). Every check here defaults to
  `BASE_URL=http://localhost:3001`.
- Update the play copy only when a batch of changes passes all checks: tell Ronny first in one line, then
  `git -C ~/Github\ Repos/ForumMagnum-layout-play checkout --detach <commit>` and restart `lw-layout`
  (about a minute).
- Every state the play copy has been on keeps a local tag, so Ronny can go back to it (his ask, Oct 29:
  "keep 3000 committed so we can go back to it"): `play-before-one-height` = 7b504ba034 (Backspace rule;
  before "no widgets inside blocks" and the one-height rule); `play-one-height` = a4d03487bb (on 3000 since
  Oct 30 2026, ~1am). Tag each new state when updating. Going back
  is the same checkout with the tag, then restart `lw-layout`.
- Its `node_modules` is an APFS clone of this one (`cp -cR`, about 30s, no extra disk): Turbopack refuses
  a `node_modules` symlink that points outside its workspace. Re-clone after a dependency change. Its
  `.env.local` and `.vercel/` are copies (never print them), plus `excalidraw/dist` and
  `public/excalidraw-assets`.
- Both servers share the dev database. That's fine (demo edits live in sessionStorage); never write to
  existing posts. The blocks demo post is rewritten by whichever server serves different demo HTML, which
  only touches that demo's own post.
- Memory with both running: about 8GB (play, fresh compile) plus 3.5GB, of 128GB.

## 9. Tarball contents (`studio:~/lw-exp3-handoff.tar.gz`)

- `session-transcript.jsonl`: this Studio session's full transcript (everything I saw and did).
- `workflows/`: inventory and design workflow scripts and journals; `design-results.json` (all designer and
  judge structured results; also committed here).
- `lw-exp3-proto/`: agent BRIEFING.md, harness, `design/<group>/` (specimens, candidate and final CSS, judge
  variants, guard prototypes), `impl/` tools, inventory and survey JSON.
- `shots/`: the designers' 122 key screenshots, my implementation shots and contact sheets (`impl/`), the
  check logs (`checks/`).
- `briefs/`: BRIEF.md, CONTEXT.md, exp2-plan.md, project notes, make-project.py, scripts/ (no env backup).
- `lw-exp3-restart.sh`: the Studio's dev server restart helper.

## 10. Open items, in order of value

1. Ronny's 3 questions (section 1).
2. Safari: calc-size fallback means code/tables scroll beside widgets there; a JS measured min-width
   (`--lw-natural-width` via ResizeObserver) would make Safari match. Test in WebKit once allowed.
3. Run the every-8px sweep on both demos (`--demo ai-futures` too); WebKit with `--engine webkit`.
4. Math designer's editor parity margins for display math (not shipped).
5. Not checked: widgets in comments, the TYPE III audio play button beside headings, dark mode.
6. Left-only rules match after any earlier left widget (CSS can't see which widget is beside a block); a JS
   mark from the guard could make it exact if Ronny cares.
7. Columns block: needs importDOM/sanitize/theme work before any widget rule matters.

## 11. Changes on Oct 29 2026 (MacBook session, after the handoff)

- **Collapsible sections are placed as they look open** (Ronny: "if the open state would not fit, then the
  closed state should not fit either"). `widgetSliverGuard.ts` `openBottom()` opens a closed section
  (`<details>` in posts, `.detailsBlockClosed`/`.closed` divs in editors) for the measurement and closes it
  again before anything is drawn; nothing listens for sections toggling. `bottomAlign.ts` never lines a
  widget up with a `.detailsBlock`, and the drag classifies sections as kind `'section'`
  (`widgetDragDom.ts`), so it never offers "bottom of" one (unit test added: 48/48). Check:
  `section-open-check.mjs` in this folder (short section beside, long one below, open and closed, editor and
  post, 1280/1024/900): all pass.
- **The editor always opens on the original post; edits live in sessionStorage** (Ronny: "no need to save
  the edits, the default should be the original"). Cause of the bug he saw: loading exported HTML back
  into the editor garbled every widget's code (an escaped copy of itself appended, growing with each
  reload; the Post tab then drew it under each widget). Exports are clean (srcdoc equals the editor's
  code); the import of exported srcdoc is what breaks. Probable cause: Chrome now escapes `<`/`>` in
  serialized attributes and the import path doesn't decode them (not confirmed). It affected Exp 2's
  editor too (frozen live; Reset clears it). `widgetDragEdits.ts` also deletes the old localStorage copies
  on first use. `?specimen` keeps the test tools working (width-sweep `--specimen`, proto-render).
  new-features-check now expects the original post (and intact widget code) back in the editor.
- **Not a bug (test gotcha):** keys sent within ~50ms of a click (Playwright's default speed) land at the
  editor's caret from load, which is the end of the post (the footnotes): the editor takes the click's
  selection a moment later. Wait 50ms or more after clicking before typing in tests. At human speed Enter works.
- **S8 (drag-check) was flaky, fixed:** after Escape on a resize, the widget kept the height its frame had
  reported at the narrow preview width, so everything below it moved again a few frames later when the frame
  reported its real height (overlays 15px off for ~100ms; failed about 1 run in 5). `restore()` in
  `startResize` now puts back the height and fit from the gesture's start. 8/8 runs pass.
- **Widget content sits 1px inside its frame** (`FIT_STYLE` in iframeResizeScript.ts; `fitWidth` subtracts the
  inset): at fractional zooms (90% on a 2x screen) Chrome trims the partial device pixel at a frame's edge, so
  a border at the widget's edge was a third thinner on the right. Measured at scale 1.8: right/left border
  width 1.29/1.81 device px before, 1.81/1.75 after; also fixed at 1.5, unchanged at 1 and 2.
- **Known editor/post mismatch (not fixed):** a paragraph plus a quote beside a widget are about 14px taller
  in the post than in the editor, so a box near a widget's bottom can land beside it in one and below it in
  the other (width-sweep "drift": the first collapsible section at 560, 640, 680px).
- **Editor/post gap after a quote (fixed):** LessWrong's `Editor.tsx` zeroes a collapsible section's margin next
  to a neighbour "that has its own margin", but its list included blockquote, which has none. Blockquote is
  out of both rules (commit 9b48019aa4); the width sweep has no drift at any width now.
- **(SUPERSEDED the same day: widgets can't go inside blocks, see "No widgets inside other blocks".)**
  **Widgets inside a quote, list item or section work like top-level ones (Ronny, Oct 29):** they get the gear
  and resize edges (no grip: a widget can't be moved out of its block), sized against the block's text
  (`widgetColumnRect` in widgetDragDom.ts; the overlay's `columnWidth` is now the width the widget is sized
  against). One in a table cell, footnote or column (never wraps) still gets no controls (drag-check R4).
  Check: `nested-check.mjs` (gear 25%, edge drag to 38%, Post tab widths). 50% can't wrap inside these
  blocks at the normal width (quote 647px leaves 291px beside, list item 289, section 296, under the 300px
  rule).
- **(SUPERSEDED, code removed:)** **Inside a block, only widths that wrap (Ronny, Oct 29: keep the 300px rule, don't lower it to 285):** a
  nested widget's gear lists `wrappableWidths(columnWidth)` (WidgetOptionsMenu `onlyWrapping`), not
  `offeredWidths`, plus its own stored width (kept, never rewritten; it shows full width with the note).
  Its edge drag uses `resizeTarget({ onlyWrapping })`: the nearest snap is still chosen among all the
  offered widths, but one that can't wrap here becomes full width, and only the wrapping snaps are
  ticks, so 38% holds to about 44% and anything wider is full width. Both go by the measured block width
  (`widgetColumnRect`), so AI content (682px, 50% leaves 309px) keeps 50%, and a 700px window drops it.
  Top-level widgets unchanged. The blocks demo has a 50% widget inside AI content for this. Checks:
  nested-check (gear lists exactly the wrapping widths in a quote, list item, section and AI content; no
  50% tick or label; past 38% goes to full width; AI content's 50% at 1280 but not at 700) and 4 unit
  tests in `iframeWidgetDragGeometry.tests.ts` (52/52).
- **Doubled gaps next to sentinels (fixed Oct 29):** see the sentinel note above. vertical-compare (scratch
  script: every top-level block's gap and height, editor vs post) finds no gap differences that don't come
  from a height difference above them.
- **Editor/post block heights (fixed Oct 29, Ronny: "fix if you can"):** vertical-compare at 1280 went from
  11 differing blocks to the 2 expected ones (a collapsible section starts open in the editor and closed
  in the post, which moves the spoiler after it). Causes and fixes:
  - Code: the export wraps each line in a span with an inline `white-space: pre-wrap`, so long lines
    wrapped in the post (a line taller, out of step with the line numbers): stylePiping `pre.code-block
    span { white-space: inherit !important }`. And the post's code block has a 1px border
    (`theme.typography.codeblock`): the editor's `.code-block` gets the same.
  - Display equations: MathJax's own `margin: 1em 0` was held inside the editor's scroll box (MathComponent
    `displayScrollContents` zeroes it; a rendered equation drops the 1em min-height).
  - Figures: the editor's `figure { margin: 0em auto }` is `1em auto` as in the post (the comment editor
    keeps 0), and its image box sits on the line's baseline like the post's inline img (the same ~9px
    above the caption; widgetNeighbours' after-widget image rule too).
  - Nested lists: the editor keeps a sublist in a wrapper `li.nested-list-item` after its parent item, so
    the parent's 6.5px margin also opened above the sublist: `li:has(+ .nested-list-item) { margin-bottom: 0 }`.
  - A widget mid-text in a list item: the post's `div.iframe-widget` broke the line, so the widget started
    a line lower than in the editor: `li > .iframe-widget:has(> .lwFloatedWidget) { display: inline }`.
  - Full-width widgets: the post's iframe was inline (a 9px baseline gap under every full-width widget)
    and is a block now; the editor's full-width placeholder has no margin (it had the code block's 8px,
    which showed inside a list item).
- **Known editor/post differences left alone:** (1) the editor's contenteditable has Chrome's
  `line-break: after-white-space`, so a line that would fit within a space's width (~4px) breaks a word
  earlier than in the post (width sweep: the first demo paragraph at 736/752px before the sweep stopped
  measuring inline math as the first line); overriding it would change how trailing spaces behave while
  typing. (2) An equation wider than the column (the second demo equation below ~700px): the post wraps
  it in HorizScrollBlock, whose touch target (-1em margin, 2em padding) plus MathJax's trapped margin
  puts it ~55px lower than the editor (LessWrong-wide behavior for wide content). The post decides that
  wrapping when the page loads, so a post loaded narrow keeps the scroll box after widening (the width
  sweep, which starts at 320px, measures the equation inside it). (3) AI Futures at 672px: the paragraph
  after the milestones widget ends level with the widget's bottom, so which view puts the next
  paragraph's first line beside the widget flips from run to run (width-sweep "line 239/0" or "0/239";
  not seen in a short sweep). (4) Full-width widget frames can be 1px taller in the post: both views
  apply the height the frame reports, and the two frames round differently.
- **No widgets inside other blocks (Ronny, Oct 29: "get rid of any functionality for putting widgets inside
  of other content blocks... use the beside a widget interactions"):** `$hoistWidget` (IframeWidgetPlugin, a
  node transform on IframeWidgetNode) moves a widget whose parent isn't the root to just before its
  top-level ancestor (a quote, list, section, AI content, table, layout columns, the footnotes), in the
  same update, so a paste or an import never leaves one nested and the block sits beside it. Removed: the
  nested gear/resize (`adjustable` is top-level only again), `widgetColumnRect`, `resizeTarget`'s
  `onlyWrapping` and WidgetOptionsMenu's `onlyWrapping`/`onDelete` (and their 4 unit tests: 48 again),
  widgetNeighbours' container rules (quote/section/AI content holding a float, the li ones), the demo's
  four nested widgets, `nested-check.mjs`. In the post, `widgetContainerWidth` is 0 inside any block, so a
  widget left inside one in old HTML never floats. Check: `content-blocks/no-nesting-check.mjs` (10: the
  demo HTML with widgets put in a quote, list item, section, AI content and table cell, opened in the
  editor; a widget moved into a quote by the editor; the same HTML in the Post tab).
- **Backspace/Delete never delete or change a widget from text (Ronny's rule, Oct 29):**
  `IframeWidgetEmbed/widgetDeleteGuard.ts`, registered in IframeWidgetPlugin at COMMAND_PRIORITY_NORMAL on
  KEY_BACKSPACE/KEY_DELETE (ahead of BlockCursorNavigationPlugin's LOW Backspace, which stepped into the
  gap and then deleted the block before it) and on DELETE_CHARACTER/WORD/LINE (input that skips the keys).
  A collapsed caret at a text edge, or in a gap, whose neighbour (skipping gaps) is a widget: if the blocks
  on both sides of the widget run are paragraphs or headings, the far one's text is joined onto the near
  one (backward: onto the block before), floated widgets go in front of the joined block, full-width ones
  after it, caret at the seam; an empty paragraph on either side is just removed; otherwise nothing.
  Suggestion mode only blocks. Range selections are untouched (they delete the widget). Found on the way:
  inside a quote, list item or section (no gaps) Backspace right after a widget merged the paragraph into
  the widget's hidden code (quote +160 chars, section +120) or emptied it (list item). Deleting on purpose
  (Ronny: "Grip, then Delete"): a plain click on the grip already focused it (the move gesture's onClick);
  that focus is the selection now: `dragMode`'s `&:has($gripTab:focus)` rings the widget, and
  `handleGripKeyDown` deletes it on Backspace or Delete (`deleteWidget` -> `$deleteWidget` in
  widgetDeleteGuard.ts: one undo step, caret onto the text next to it, editor focused so Cmd+Z works). A
  nested widget (no grip) gets a "Delete widget" button in its gear menu (WidgetOptionsMenu `onDelete`,
  nested only). Check: `content-blocks/delete-key-check.mjs` (29 checks).
- **Test notes (Oct 29):** section-open-check sometimes failed (the arrow click left the long section open,
  about one run in eight). Cause, found by its pointer report: `scrollIntoViewIfNeeded` scrolled up to the
  title, LessWrong's header (headroom) reappeared on the scroll up and covered the title, so the click hit
  the header. It now scrolls the title to the middle of the window and waits for it to settle.
  width-sweep's display-equation check now also covers the post's scroll box around a wide equation (it
  was measuring MathJax's hidden screen-reader copy there: 236 false "drift" widths).
- **No two widgets at one height (Ronny, Oct 29: "if you passed a horizontal line down the post, it would
  only ever intersect one widget at a time"; his three screenshots: a widget beside another at one
  paragraph's top, and one lined up with the AI content the other still ran beside, are not allowed; one
  below the other's end is fine).** Two layers:
  - Display: every float clears both sides (HydratedIframeWidget `floatLeft`/`floatRight`, the editor's
    `placeSpacer`), so two floats never share a height on the page, whatever the width or the text.
  - Editor: `WidgetRoom` / `spotProblem` / `findSpot` / `roomInPlace` in widgetDragGeometry.ts. A spot is
    a flow block's top or bottom (or the end of the post). It has room if no other float lines up with that
    block (`widgetLinedUpWith`: floats between it and the flow block before it), every float before it has
    ended by the widget's top, and every float after it (up to the next block that clears it) starts below
    the widget's bottom once the text between them has wrapped around it: `f.top - top >= height * share`,
    share = the column fraction left beside the widget (`besideShare`). The widget's top: right after the
    block before it, i.e. `before.bottom + before.marginBottom` (BlockBox.marginBottom, measured in
    measureBlocks; Chrome puts a float there, before the next block's top margin, so after AI content, with
    no bottom margin, a float starts 12px above the paragraph's text box) + 6px (its top margin).
    `chooseDropSlot` aims as before, then `findSpot` takes the first spot from the aim on down with room
    (spot order: top, bottom, next block's top...), else the nearest above; none: `noRoom` (noOp).
    DropSlot `moved: 'down'|'up'|null` and `noRoom` replace `passedTaken`/`stacked`/`besideOpposite`;
    chips "moved down, clear of the widget above" / "moved up, clear of the widget below" / "No room: ...".
    `adjacentSlot(blocks, key, dir, room|null, align)` skips spots without room (keeping the alignment; a
    bottom-aligned widget is checked at a non-paragraph's top). The gear (`canPlace` -> `roomInPlace`)
    greys out Left/Right on a full-width widget and Top/Bottom on a float where they'd put it beside
    another widget (note `data-testid=widget-options-no-room`); widths aren't checked (height unknown
    until shown). `roomInPlace` for a full-width widget first moves everything after it up by
    `self.bottom - before.bottom` (it's no longer a block). Resize: `hasRoom` against the blocks measured
    when the resize started (in the live preview the floats below are already pushed by clearance), with
    the widget's current height; no room: chip "no room, another widget is beside the text here", and
    letting go restores the start layout. `$sideTaken` and `besideOppositeFloat` are gone.
  - Not covered (the display layer handles them): text edits that bring two widgets together, other window
    widths, and a left/right widget's width change making it taller.
  - Checks: unit tests 54 (the old stacking/besideOpposite tests became room-rule tests, plus Ronny's three
    states); `content-blocks/one-height-check.mjs` (16: the three states by drag, ArrowUp x3, the gear and
    a resize on a full-width widget beside the right widget's end, the Post tab); width-sweep's new
    "shared" check (pairs of widgets, any kind, sharing a height, in either view) at every width.
- **Quotes/sections/lists beside a right widget after an earlier left one (Ronny, Oct 30: "A quote on the
  left beside a widget on the right. if it gets longer, it does not flow"):** widgetNeighbours' box rule was
  `LEFT_FLOAT ~ blockquote` (and `.detailsBlock`, list items), i.e. after ANY earlier left widget, so the
  blocks demo's right-widget quote was a flow-root box and stayed narrow below the widget. Pure CSS can't say
  "the nearest preceding float is left" (`~` can't exclude a right float in between without also excluding
  the left-quote-then-right-quote case), so the sliver guard now marks them: `markAfterLeftWidget`
  (widgetSliverGuard.ts) walks the root's children, tracks the last widget's side (a full-width widget or a
  block with `clear` resets it) and sets `data-lw-after-left` (AFTER_LEFT_WIDGET_ATTR) on blockquote,
  .detailsBlock, ul and ol; the rules select `blockquote[data-lw-after-left]` etc. It runs before
  markSlivers (which measures the boxes), and a change fires WIDGET_LAYOUT_EVENT. The editor's update
  listener also schedules the guard while any marked block is left (all widgets deleted). One-height makes
  "nearest widget above" the only one that can be beside a block. Check: `content-blocks/quote-flow-check.mjs`.

