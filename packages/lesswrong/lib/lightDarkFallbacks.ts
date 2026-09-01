const lightDarkStart = "light-dark(";

/**
 * Replace every `light-dark(lightColor, darkColor)` in the given CSS (or CSS
 * fragment) with just `lightColor`. Used for email stylesheets (email clients
 * don't support `light-dark()`) and for building fallback declarations for
 * browsers that predate `light-dark()` support (Safari <17.5).
 */
export function replaceLightDarkWithLightModeColor(stylesheet: string): string {
  let css = "";
  let startIndex = 0;

  while (true) {
    const matchIndex = stylesheet.indexOf(lightDarkStart, startIndex);
    if (matchIndex === -1) {
      return css + stylesheet.slice(startIndex);
    }

    css += stylesheet.slice(startIndex, matchIndex);

    let depth = 1;
    let firstArgumentEnd = -1;
    let endIndex = matchIndex + lightDarkStart.length;

    for (; endIndex < stylesheet.length; endIndex++) {
      const character = stylesheet[endIndex];

      if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      } else if (character === "," && depth === 1 && firstArgumentEnd === -1) {
        firstArgumentEnd = endIndex;
      }
    }

    if (depth !== 0 || firstArgumentEnd === -1) {
      return css + stylesheet.slice(matchIndex);
    }

    css += stylesheet
      .slice(matchIndex + lightDarkStart.length, firstArgumentEnd)
      .trim();
    startIndex = endIndex + 1;
  }
}

// Matches a full `property: value` declaration whose value contains
// `light-dark(`. The value can't contain `;`, `{`, or `}` (light-dark
// arguments are colors, which never contain those characters), so scanning
// with [^;{}] can't escape the declaration. The terminating `;` or `}` is
// matched with a lookahead so it's left in place.
const declarationWithLightDarkRegex = /[-\w]+\s*:[^;{}]*light-dark\([^;{}]*(?=[;}])/g;

/**
 * Browsers without `light-dark()` support (Safari <17.5) drop any declaration
 * containing it, leaving e.g. backgrounds transparent. For each such
 * declaration, insert a copy before it with the light-mode color, so old
 * browsers get light-mode styling while modern browsers override it with the
 * `light-dark()` version. Must be applied after minification: csso's
 * restructuring would strip the "overridden" fallback declaration.
 */
export function addLightDarkFallbacks(css: string): string {
  return css.replace(
    declarationWithLightDarkRegex,
    (declaration) => `${replaceLightDarkWithLightModeColor(declaration)};${declaration}`,
  );
}
