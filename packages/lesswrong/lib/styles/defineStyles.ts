import type { StylesContextType } from "@/components/hooks/useStyles";
import type { StyleDefinition, StyleOptions } from "@/server/styleGeneration";
import { isClient } from "../executionEnvironment";
import { createAndInsertStyleNode, type JssStyles } from "../jssStyles";


/**
 * _clientMountedStyles: Client-side-only global variable that contains the
 * style context, as an alternative to getting it through React context. This
 * is client-side-only because on the server, where there may be more than one
 * render happening concurrently for different users, there isn't a meaningful
 * answer to questions like "what is the current theme". But when doing
 * hot-module reloading on the client, we need "the current theme" in order to
 * update any styles mounted in the <head> block.
 */
let _clientMountedStyles: StylesContextType | null = null;
export function setClientMountedStyles(styles: StylesContextType) {
  _clientMountedStyles = styles;
}

export const topLevelStyleDefinitions: Record<string, StyleDefinition<string>> = {};

export const defineStyles = <T extends string, N extends string>(
  name: N,
  styles: (theme: ThemeType) => JssStyles<T>,
  options?: StyleOptions
): StyleDefinition<T, N> => {
  const definition: StyleDefinition<T, N> = {
    name,
    styles,
    options,
    nameProxy: null,
  };
  topLevelStyleDefinitions[name] = definition;

  if (isClient && _clientMountedStyles) {
    const mountedStyles = _clientMountedStyles.mountedStyles.get(name);
    if (mountedStyles) {
      mountedStyles.styleNode?.remove();
      mountedStyles.styleNode = createAndInsertStyleNode(_clientMountedStyles.theme, definition);
    }
  }

  return definition;
};
