# Experiment 3 state: content blocks next to partial-width widgets

Updated: Oct 29 2026, about 1:45am PT (Mac Studio session "Lw variable widget width (studio)").

## Where things are
- Branch: `experiment/iframe-layout-ronny-exp3` (from exp2 tip 6a5a86cf1c). Push only with `git push origin experiment/iframe-layout-ronny-exp3`.
- Routes: `/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e` (+ `/editor`), second post `/blocks` (+ `/blocks/editor`).
- Vercel project: `lw-experiment-widget-blocks-c4b9cuhv8val44y0`. Deploy: `cd ~/.claude/briefs/lw-widget-exp3 && python3 make-project.py unused deploy`, then `... status <dpl_id>`.
- Brief and context: `~/.claude/briefs/lw-widget-exp3/BRIEF.md`, `CONTEXT.md` (Studio only).
- Screenshots outside the repo: `~/lw-exp3-shots/` (Studio).
- Dev server log: `~/Library/Logs/lw-exp3-dev.log`. Restart helper: `~/lw-exp3-restart.sh` (Studio).
- Live: https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor
  (Post tab: same without /editor; second post: /blocks and /blocks/editor).
- Prototype harness: `tools/proto-render.mjs` renders any specimen HTML in the real editor and Post tab
  (through the stored-edits key), injects candidate CSS, screenshots each section, and reports overlaps.
  Run through `tools/with-slot.sh` (3 shared browser slots).

## Checks so far
- new-features-check and drag-check (main, mvp1, narrow, phone, wide, touch, shrink, bottom) pass on
  both the Exp 3 and Exp 2 editors on this branch.

## Gotchas found on the Studio
- Editing route files while a browser check runs can put the dev server in a reload loop; restart it.
- zsh: never name a variable `path` (it is tied to PATH).

## Phases
| Phase | Status |
|---|---|
| Branch + baseline | done: tsc 0 errors after `yarn next typegen` (delete `tsconfig.tsbuildinfo` if a new route's type is missing); lint clean |
| Exp 3 route (AI Futures post) + first deploy | done |
| Editor column = reader column at every width | done (also with wide content since Oct 29: Editor.tsx minWidth 0) |
| Inventory of block types | done: 72 kinds, `inventory.json` |
| Decisions (prototype, judge) | done: 14 groups, design results in ~/lw-exp3-proto/design/design-results-final.json (Studio) |
| Implementation (editor + reader) | done: `components/contents/widgetNeighbours.ts` (one rule table, both views), `widgetSliverGuard.ts`, bottomAlign, drag geometry |
| Second demo post + post switch | done: `demo/blocksDemoSource.ts` |
| Checks | width sweep (`width-sweep.mjs`) 0 problems at 57 widths; drag checks rerunning |
| Deploy + REPORT.md | in progress |

## How the pieces fit
- `widgetNeighbours.ts`: every block's rule as data; `widgetNeighbourGlobals('post' | 'editor')` makes the JSS
  '@global' entries for HydratedIframeWidget (post) and IframeWidgetPlugin (editor). Change a behavior there.
- `widgetSliverGuard.ts`: after layout, marks boxes that barely touch a widget (or hang below it more than they
  sit beside it) with `data-lw-below` (clears). Fires `lw-widget-layout` on the root when it moved something;
  the editor's overlays re-measure and bottom-aligned widgets realign on it.
- Gotcha: the dev server sometimes falls into a page reload loop after restarts (every page reloads every
  second). Restart again, and kill leftover headless Chrome (`pkill -f "Google Chrome for Testing"`).
