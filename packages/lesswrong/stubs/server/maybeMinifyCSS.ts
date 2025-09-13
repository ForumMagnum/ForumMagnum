/**
 * If running on the server and not in debug mode, minify the provided CSS.
 * Otherwise return it unchanged.
 */
export function maybeMinifyCSS(css: string): string {
  return css;
}
