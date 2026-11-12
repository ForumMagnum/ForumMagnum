// Not vendored (a LessWrong addition): type declarations for the non-code
// files imported by the vendored source. Upstream gets these from `vite/client`
// (referenced by packages/excalidraw/vite-env.d.ts), since it builds with Vite,
// but we don't, and Vite isn't installed here. build.mjs turns these imports
// into URL strings.
declare module "*.woff2" {
  const url: string;
  export default url;
}
