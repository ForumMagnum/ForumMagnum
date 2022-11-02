import type { Theme as MuiThemeType } from '@material-ui/core/styles';

const requestedCssVars = new Set<string>();

const separator = ":";
const pathToKey = (path: string[]) => path.join(separator);
const keyToPath = (key: string) => key.split(separator);
const keyToVar = (key: string) => "--" + key.replace(new RegExp(separator, "g"), "-");
const keyToVarRef = (key: string) => `var(${keyToVar(key)})`;
const getAtPath = <T extends {}>(data: T, path: string[]) => path.length < 2
  ? data[path[0]]
  : getAtPath(data[path[0]], path.slice(1));

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
 *
 * NOTE: `requireCssVar` MUST be called at the top level of a file and not inside a component. It's
 * not a React hook!
 */
export const requireCssVar = (...path: string[]): string => {
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
