import { isDevelopment } from '@/lib/executionEnvironment';

const alwaysMinify = true;

/**
 * If running on the server and not in debug mode, minify the provided CSS.
 * Otherwise return it unchanged.
 */
export function maybeMinifyCSS(css: string): string {
  if (isDevelopment && !alwaysMinify) {
    return css;
  } else {
    const { minify } = require('csso');
    return minify(css).css;
  }
}
