# Experiment 3 state: content blocks next to partial-width widgets

Updated: Oct 28 2026, evening PT (Mac Studio session "Lw variable widget width (studio)").

## Where things are
- Branch: `experiment/iframe-layout-ronny-exp3` (from exp2 tip 6a5a86cf1c). Push only with `git push origin experiment/iframe-layout-ronny-exp3`.
- Route (planned): `/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e` and `/editor`.
- Vercel project: `lw-experiment-widget-blocks-c4b9cuhv8val44y0`. Deploy: `cd ~/.claude/briefs/lw-widget-exp3 && python3 make-project.py unused deploy`, then `... status <dpl_id>`.
- Brief and context: `~/.claude/briefs/lw-widget-exp3/BRIEF.md`, `CONTEXT.md` (Studio only).
- Screenshots outside the repo: `~/lw-exp3-shots/` (Studio).
- Dev server log: `~/Library/Logs/lw-exp3-dev.log`. Restart helper: `~/lw-exp3-restart.sh` (Studio).
- Live: https://lw-experiment-widget-blocks-c4b9cuhv8val44y0-lesswrong.vercel.app/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e/editor
  (Post tab: same without /editor; second post: /blocks and /blocks/editor).
- Prototype harness: `tools/proto-render.mjs` renders any specimen HTML in the real editor and Post tab
  (through the stored-edits key), injects candidate CSS, screenshots each section, and reports overlaps.
  Run through `tools/with-slot.sh` (3 shared browser slots).

## Gotchas found on the Studio
- Editing route files while a browser check runs can put the dev server in a reload loop; restart it.
- zsh: never name a variable `path` (it is tied to PATH).

## Phases
| Phase | Status |
|---|---|
| Branch + baseline | done: tsc 0 errors after `yarn next typegen` (delete `tsconfig.tsbuildinfo` if a new route's type is missing); lint clean |
| Exp 3 route (AI Futures post) + first deploy | done, READY Oct 28 evening |
| Editor column = reader column at every width | done (columns-check.mjs: 0 differences 312 to 1300px) |
| Reader phone override only for centered widgets | done (editor and reader now agree under 600px) |
| Second post scaffolding (routes, ensure code) | done, content placeholder |
| Inventory of block types | not started |
| Decisions (prototype, judge) | not started |
| Implementation (editor + reader) | not started |
| Second demo post + post switch | not started |
| Checks (width sweep) + deploy | not started |
| REPORT.md | not started |
