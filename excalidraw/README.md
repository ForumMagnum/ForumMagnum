# Vendored Excalidraw

This directory contains a vendored copy of [Excalidraw](https://github.com/excalidraw/excalidraw)
(MIT licensed, see `LICENSE`), which is used for the diagram editor in the
Lexical post editor (see `packages/lesswrong/components/lexical/ui/ExcalidrawModal.tsx`).

We vendor it rather than depending on the npm package because the latest
stable release (0.18.1) is far behind upstream's main branch, and so that we
can patch it.

## Version

The source in `packages/` is from upstream commit
[a52cd200927a975322934b42b966133232724bad](https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad)
(the head of upstream's `release` branch on 2026-09-29, which is the commit
the `@excalidraw/excalidraw@0.18.0-a52cd20` npm snapshot was built from).
Every vendored source file starts with a `Vendored from:` comment with that
commit's URL.

Only the packages that make up the editor were copied
(`common`, `element`, `excalidraw`, `fractional-indexing`, `laser-pointer`,
`math`, `utils`), without their tests. `yarn.lock` started as a copy of
upstream's, so dependency versions match upstream's.

## Local modifications

Changes to vendored source files are marked with `LessWrong patch` comments
(except in JSON files, which can't have comments).

- `packages/excalidraw/fonts/ExcalidrawFontFace.ts`: removed the fallback that
  loads fonts from esm.sh if they can't be loaded from our server.
- `packages/excalidraw/locales/en.json`: the help dialog's "Read our blog"
  link is labelled "Excalidraw blog" instead (`helpDialog.blog`), since in
  our context "our" would read as referring to LessWrong.
- Test files and test helpers were removed, as were upstream's per-package
  `.eslintrc.json`, `.gitignore` and `.size-limit.json` files.
- `assets.d.ts` (ours, not vendored) declares the types of the source's font
  imports. Upstream gets those from Vite's types (via
  `packages/excalidraw/vite-env.d.ts`), but we don't build with Vite. The build
  must not depend on anything installed outside this directory (in
  particular, the main app's devDependencies aren't installed in deploys).

## Building

The build output isn't committed. It's built by the main app's
`scripts/postinstall.sh` (so, on every `yarn install`, including in deploys),
and by the `setupEnvironment` GitHub action in CI. `build.mjs` skips the build
if none of its inputs have changed since the last one; to force a rebuild, run

```
yarn rebuild-excalidraw
```

(which runs `yarn install && yarn build --force` in this directory). `build.mjs`
produces (both gitignored):

- `dist/`: an ESM bundle (with lazily-loaded chunks) of the editor, with
  everything but React bundled in; its CSS; type declarations; and
  `readerFontFaces.json`, which lists the fonts used to display diagrams
  outside the editor (see `packages/lesswrong/lib/lexical/excalidrawFontFaces.ts`).
- `../public/excalidraw-assets/fonts/`: the font files, which are served from
  `/excalidraw-assets/fonts/`.

The main app imports the bundle as `@excalidraw/excalidraw` (and types as
`@excalidraw/excalidraw/types`, etc), via path aliases in
`tsconfig-shared.json` and `tsconfig-repl.json`.

## Updating

1. Check out the new upstream commit, and replace the contents of `packages/`
   with its `packages/{common,element,excalidraw,fractional-indexing,laser-pointer,math,utils}`
   and `packages/tsconfig.base.json`, minus tests (`tests/`, `__tests__/`,
   `__snapshots__/`, `*.test.ts(x)`, and test helpers) and the other files
   listed under local modifications.
2. Prepend the `// Vendored from: https://github.com/excalidraw/excalidraw/commit/<commit-id>`
   line to every `.ts`, `.tsx`, `.js`, `.cjs` and `.scss` file (and a
   `/* ... */` version of it to `.css` files).
3. Reapply the local modifications listed above.
4. Update `dependencies` in `package.json` to match the `dependencies` of the
   vendored packages, and update `version`.
5. Run `yarn rebuild-excalidraw`, and check the changelog
   (`packages/excalidraw/CHANGELOG.md`) for breaking changes to the props and
   functions used by `ExcalidrawModal.tsx`.
