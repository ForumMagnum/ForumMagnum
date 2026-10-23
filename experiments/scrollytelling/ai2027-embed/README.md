# AI 2027 HUD as a LessWrong scrolly widget (experiment)

Builds the original AI 2027 dashboard (from a local checkout of LessWrong2/ai-2027 at
`~/Downloads/ai-2027-graphic`) into one self-contained HTML file that runs as an ordinary
LessWrong iframe widget. The `<meta name="lw-scrolly">` tag makes `ScrollyIframeWidget`
pin it beside the text and send it `{type: 'lw-scrolly', heading, progress}` on scroll.
`sections.json` maps each essay heading to its date markers.

Rebuild (paths are absolute to Ronny's machine):

1. Concatenate the app's `globals.css`, `tufte.css` (font URLs made absolute), `tufte-charts.css`,
   and `embed-extra.css` into `input.css`, then compile it with the app's Tailwind:
   `./node_modules/.bin/tailwindcss -c tailwind.config.ts -i input.css -o out/embed.css --minify`
2. `node build.mjs` (esbuild bundle, audio context stubbed out)
3. `python3 assemble.py` (inlines fonts and icons; base64-wraps the script because LW's
   widget save path decodes HTML entities like `&gt` inside scripts)

The draft is created with `packages/lesswrong/scripts/scrollyExperimentDraft.ts`.
