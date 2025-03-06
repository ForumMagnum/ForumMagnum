import { getAtPath } from '../lib/helpers';
import { Theme as MuiThemeType } from "@/components/mui-replacement";

type ThemePathItem = string | number;
type ThemePath = ThemePathItem[];

const requestedCssVars = new Set<string>();

const parsePathItem = (item: string): ThemePathItem => {
  const parsed = parseInt(item);
  return Number.isNaN(parsed) ? item : parsed;
}

const separator = ":";
const pathToKey = (path: ThemePath): string => path.join(separator);
const keyToPath = (key: string): ThemePath => key.split(separator).map(parsePathItem);
const keyToVar = (key: string): string => "--" + key.replace(new RegExp(separator, "g"), "-");
const keyToVarRef = (key: string): string => `var(${keyToVar(key)})`;

/**
 * During SSR, we may not know which theme is currently being used if the user has their theme
 * set to "auto", which can cause issues for components which need to include some specific
 * styles conditionally. This function provides a work-around for this problem by exporting
 * particular values from the theme as CSS variables, which will gracefully handle theme changes
 * on the client side.
 *
 * For instance, if we want to use the theme value `theme.palette.panelBackground.dim`, we can do:
 * const background = requireCssVar("palette", "panelBackground", "dim");
 * const MyComponent = () => <div style={{background}} />;
 * This will set the style to `{background: var(--palette-panelBackground-dim)}` which will be
 * read from a theme-dependant stylesheet.
 *
 * NOTE: `requireCssVar` MUST be called at the top level of a file and not inside a component. It's
 * not a React hook!
 */
export const requireCssVar = (...path: ThemePath): string => {
  const key = pathToKey(path);
  requestedCssVars.add(key);
  return keyToVarRef(key);
}

export const requestedCssVarsToString = (theme: MuiThemeType & ThemeType, selector = ":root"): string => {
  const vars: string[] = [];
  for (const key of requestedCssVars.values()) {
    const value = getAtPath(theme, keyToPath(key));
    if (value) {
      vars.push(`${keyToVar(key)}: ${value};`);
    } else {
      // eslint-disable-next-line
      console.warn("Warning: Invalid theme key:", key);
    }
  }
  return `${selector} { ${vars.join("")} }`;
}
