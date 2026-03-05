import type { ClassNameProxy, StyleDefinition, StyleOptions } from "@/server/styleGeneration";
import type { StylesContextType } from "./useStyles";
import { createAndInsertStyleNode, type JssStyles } from "@/lib/jssStyles";
import { isClient } from "@/lib/executionEnvironment";

/**
 * _clientMountedStyles: Client-side-only global variable that contains the
 * style context, as an alternative to getting it through React context. This
 * is client-side-only because on the server, where there may be more than one
 * render happening concurrently for different users, there isn't a meaningful
 * answer to questions like "what is the current theme". But when doing
 * hot-module reloading on the client, we need "the current theme" in order to
 * update any styles mounted in the <head> block.
 */
let _clientMountedStyles: StylesContextType|null = null;
export function setClientMountedStyles(styles: StylesContextType) {
  _clientMountedStyles = styles;
}

export const topLevelStyleDefinitions: Record<string,StyleDefinition<string>> = {};

export const defineStyles = <T extends string, N extends string>(
  name: N,
  styles: (theme: ThemeType) => JssStyles<T>,
  options?: StyleOptions
): StyleDefinition<T,N> => {
  const definition: StyleDefinition<T,N> = {
    name,
    styles,
    options,
    nameProxy: null,
  };
  topLevelStyleDefinitions[name] = definition;
  
  // If defineStyles has already been called with this name, either there
  // are two defineStyles calls with the same name in the codebase (an
  // error) *or* we are doing hot module reloading, and should replace
  // the styles in-place. (HMR works this way in both Vite and Nextjs).
  // Since the HMR case is important, we don't enforce unique style
  // names here.

  if (isClient && _clientMountedStyles) {
    const mountedStyles = _clientMountedStyles.mountedStyles.get(name);
    if (mountedStyles) {
      mountedStyles.styleNode?.remove();
      mountedStyles.styleNode = createAndInsertStyleNode(_clientMountedStyles.initialTheme, definition);
    }
  }
  
  return definition;
}

export const classNameProxy = <T extends string>(prefix: string): ClassNameProxy<T> => {
  return new Proxy({}, {
    get: function(obj: any, prop: any) {
      // Check that the prop is really a string. This isn't an error that comes
      // up normally, but apparently React devtools will try to query for non-
      // string properties sometimes when using the component debugger.
      if (typeof prop === "string")
        return prefix+prop;
      else
        return prefix+'invalid';
    }
  });
}
