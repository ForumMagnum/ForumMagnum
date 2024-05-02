
// When we compile CkEditor with Webpack, a plugin converts svg files
// (including svg files found in node_modules) on import. This declaration tells
// Typescript what that means.
// (Thanks to: https://stackoverflow.com/questions/44717164/unable-to-import-svg-files-in-typescript)
declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
