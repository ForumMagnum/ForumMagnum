
// When we compile CkEditor with Webpack, a plugin converts svg files
// (including svg files found in node_modules) on import. This declaration tells
// Typescript what that means.
declare module "*.svg" {
  const content: string
  export default content;
}
