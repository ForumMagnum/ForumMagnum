import React, { createContext, forwardRef, useContext, useLayoutEffect } from "react";
import type { ClassNameProxy, StyleDefinition, StyleOptions } from "@/server/styleGeneration";
import type { JssStyles } from "@/lib/jssStyles";
import { create as jssCreate, SheetsRegistry } from 'jss';
import jssGlobal from 'jss-plugin-global';
import jssNested from 'jss-plugin-nested';
import jssCamelCase from 'jss-plugin-camel-case';
import jssDefaultUnit from 'jss-plugin-default-unit';
import jssVendorPrefixer from 'jss-plugin-vendor-prefixer';
import jssPropsSort from 'jss-plugin-props-sort';
import { isClient } from "@/lib/executionEnvironment";
import { useTheme } from "../themes/useTheme";
import { useServerInsertedHtml } from "./useServerInsertedHtml";

export type StylesContextType = {
  theme: ThemeType
  mountedStyles: Map<string, {
    refcount: number
    styleDefinition: StyleDefinition<any>
    styleNode?: HTMLStyleElement
  }>
}

export const StylesContext = createContext<StylesContextType|null>(null);


export function createStylesContext(theme: ThemeType): StylesContextType {
  return {
    theme,
    mountedStyles: new Map<string, {
      refcount: number
      styleDefinition: StyleDefinition<any>
      styleNode?: HTMLStyleElement
    }>()
  };
}

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
  
  if (isClient && _clientMountedStyles) {
    const mountedStyles = _clientMountedStyles.mountedStyles.get(name);
    if (mountedStyles) {
      mountedStyles.styleNode?.remove();
      mountedStyles.styleNode = createAndInsertStyleNode(_clientMountedStyles.theme, definition);
    }
  }
  
  return definition;
}

function addStyleUsage<T extends string>(context: StylesContextType, styleDefinition: StyleDefinition<T>) {
  const theme = context.theme;
  const name = styleDefinition.name;

  if (!context.mountedStyles.has(name)) {
    // No style mounted by that name? Add it
    context.mountedStyles.set(name, {
      refcount: 1,
      styleDefinition,
      styleNode: createAndInsertStyleNode(theme, styleDefinition)!,
    });
  } else {
    const mountedStyleNode = context.mountedStyles.get(name)!
    if (mountedStyleNode.styleDefinition !== styleDefinition) {
      // Style is mounted by that name, but it doesn't match? Replace it, keeping
      // the ref count
      mountedStyleNode.styleNode?.remove();
      mountedStyleNode.styleNode = createAndInsertStyleNode(theme, styleDefinition);
      context.mountedStyles.get(name)!.refcount++;
    } else {
      // Otherwise, just incr the refcount
      context.mountedStyles.get(name)!.refcount++;
    }
  }
}

function removeStyleUsage<T extends string>(context: StylesContextType, styleDefinition: StyleDefinition<T>) {
  const name = styleDefinition.name;
  if (context.mountedStyles.has(name)) {
    const mountedStyle = context.mountedStyles.get(name)!
    const newRefcount = --mountedStyle.refcount;
    if (!newRefcount) {
      mountedStyle.styleNode?.remove();
      context.mountedStyles.delete(name);
    }
  }
}

export const useStyles = <T extends string>(styles: StyleDefinition<T>, overrideClasses?: Partial<JssStyles<T>>): JssStyles<T> => {
  const stylesContext = useContext(StylesContext);

  if (bundleIsServer) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useServerInsertedHtml(() => {
      if (!stylesContext || stylesContext.mountedStyles.has(styles.name)) {
        return null;
      }
      stylesContext.mountedStyles.set(styles.name, {
        refcount: 1,
        styleDefinition: styles,
      });

      return serverEmbeddedStyles(stylesContext.theme, styles);
    });

    if (stylesContext) {
      // If we're rendering server-side, we might or might not have
      // StylesContext. If we do, use it to record which styles were used during
      // the render. This is used when rendering emails, or if you want to serve
      // an SSR with styles inlined rather than in a static stlyesheet.
      if (!stylesContext.mountedStyles.has(styles.name)) {
        stylesContext.mountedStyles.set(styles.name, {
          refcount: 1,
          styleDefinition: styles,
        });
      }
    }
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      if (stylesContext) {
        addStyleUsage(stylesContext, styles);
        return () => removeStyleUsage(stylesContext, styles);
      }
    }, [styles, stylesContext, stylesContext?.theme]);
  }

  if (!styles.nameProxy) {
    styles.nameProxy = classNameProxy(styles.name+"-");
  }
  if (overrideClasses) {
    return overrideClassesProxy(styles.name+"-", overrideClasses)
  } else {
    return styles.nameProxy;
  }
}

/**
 * Like useStyles, but returns classes in the form of an object with all
 * classes in it as regular fields, rather than a proxy. This is less efficient,
 * but is compatible with some janky object-spreading hacks inside vendored
 * material-UI code.
 */
export const useStylesNonProxy = <T extends string>(styles: StyleDefinition<T>, overrideClasses?: Partial<JssStyles<T>>): JssStyles<T> => {
  const stylesContext = useContext(StylesContext);
  const theme = useTheme();

  if (bundleIsServer) {
    // If we're rendering server-side, we might or might not have
    // StylesContext. If we do, use it to record which styles were used during
    // the render. This is used when rendering emails, or if you want to server
    // an SSR with styles inlined rather than in a static stlyesheet.
    if (stylesContext) {
      if (!stylesContext.mountedStyles.has(styles.name)) {
        stylesContext.mountedStyles.set(styles.name, {
          refcount: 1,
          styleDefinition: styles,
        });
      }
    }
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      if (stylesContext) {
        addStyleUsage(stylesContext, styles);
        return () => removeStyleUsage(stylesContext, styles);
      }
    }, [styles, stylesContext, stylesContext?.theme]);
  }

  const styleKeys = Object.keys(styles.styles(theme));
  const styleKeysSet = new Set(styleKeys);
  const allClasses = [
    ...styleKeys,
    ...(overrideClasses ? Object.keys(overrideClasses) : [])
  ];
  return Object.fromEntries(
    allClasses.map(key => [
      key,
      [
        ...(styleKeysSet.has(key) ? [`${styles.name}-${key}`] : []),
        ...((overrideClasses && (key in overrideClasses))
          ? [(overrideClasses as any)[key]]
          : []
        ),
      ].join(" ")
    ])
  ) as JssStyles<T>;
}


export const withStyles = <T extends {classes: any}>(styles: StyleDefinition, Component: React.ComponentType<T>) => {
  return forwardRef(function WithStylesHoc(props: AnyBecauseHard, ref: AnyBecauseHard) {
    const { classes: classesOverrides } = props;
    const classes = useStyles(styles, classesOverrides);
    return <Component ref={ref} {...props} classes={classes} />
  }) as unknown as React.ForwardRefExoticComponent<Omit<T, "classes"> & { classes?: Partial<T["classes"]> } & React.RefAttributes<any>>;
}

export function getClassName<T extends StyleDefinition>(
  stylesName: T["name"],
  className: keyof ReturnType<T["styles"]> & string
) {
  return `${stylesName}-${className}`;
}

export const withAddClasses = (
  styles: (theme: ThemeType) => JssStyles,
  name: string,
  options?: StyleOptions,
) => {
  const styleDefinition = defineStyles(name, styles, options);

  return (Component: AnyBecauseHard) => {
    return function AddClassesHoc(props: AnyBecauseHard) {
      const {children, ...otherProps} = props;
      const classes = useStyles(styleDefinition);
      return <Component {...otherProps} classes={classes}>
        {children}
      </Component>
    }
  }
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


export const overrideClassesProxy = <T extends string>(prefix: string, overrideClasses: Partial<JssStyles<T>>): ClassNameProxy<T> => {
  return new Proxy({}, {
    get: function(obj: any, prop: any) {
      if (typeof prop === "string") {
        if (prop in overrideClasses) {
          return `${prefix}${prop} ${overrideClasses[prop as T]!}`;
        } else {
          return prefix+prop;
        }
      } else {
        return prefix+'invalid';
      }
    }
  });
}

function createAndInsertStyleNode(theme: ThemeType, styleDefinition: StyleDefinition): HTMLStyleElement {
  const stylesStr = styleNodeToString(theme, styleDefinition);
  const styleNode = document.createElement("style");
  styleNode.append(document.createTextNode(stylesStr));
  styleNode.setAttribute("data-name", styleDefinition.name);
  styleNode.setAttribute("data-priority", styleDefinition.name);
  insertStyleNodeAtCorrectPosition(styleNode, styleDefinition.name, styleDefinition.options?.stylePriority ?? 0);
  return styleNode;
}

function styleNodeToString(theme: ThemeType, styleDefinition: StyleDefinition): string {
  const sheets = new SheetsRegistry()
  
  const jss = getJss();
  const sheet = jss.createStyleSheet(
    styleDefinition.styles(theme), {
      generateId: (rule,sheet) => {
        if (rule.type === 'keyframes') {
          return (rule as AnyBecauseHard).name;
        }
        return `${styleDefinition.name}-${rule.key}`
      },
    }
  );
  sheets.add(sheet);
  return sheets.toString();
}

function serverEmbeddedStyles(theme: ThemeType, styleDefinition: StyleDefinition) {
  const stylesStr = styleNodeToString(theme, styleDefinition);
  const priority = styleDefinition.options?.stylePriority ?? 0;
  return `<script>_embedStyles(${JSON.stringify(styleDefinition.name)},${priority},${JSON.stringify(stylesStr)})</script>`;
}

export function getEmbeddedStyleLoaderScript() {
  // FIXME: Needs auto-dark-mode support
  return `
  <style id="jss-insertion-start"></style>
  <style id="jss-insertion-end"></style>
  <script>_embedStyles=function(name,priority,css) {
    const styleNode = document.createElement("style");
    styleNode.append(document.createTextNode(css));
    styleNode.setAttribute("data-name", name);
    styleNode.setAttribute("data-priority", priority);

    const head = document.head;
    const startNode = document.getElementById('jss-insertion-start');
    const endNode = document.getElementById('jss-insertion-end');
  
    if (!startNode || !endNode) {
      throw new Error('Insertion point markers not found');
    }
  
    styleNode.setAttribute('data-priority', priority.toString());
    styleNode.setAttribute('data-name', name);
  
    const styleNodes = Array.from(head.querySelectorAll('style[data-priority]'));
    let left = 0;
    let right = styleNodes.length - 1;
  
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midNode = styleNodes[mid];
      const midPriority = parseInt(midNode.getAttribute('data-priority') || '0', 10);
      const midName = midNode.getAttribute('data-name') || '';
    
      if (midPriority < priority || (midPriority === priority && midName < name)) {
        left = mid + 1;
      } else if (midPriority > priority || (midPriority === priority && midName > name)) {
        right = mid - 1;
      } else {
        // Equal priority and name, insert after this node
        midNode.insertAdjacentElement('afterend', styleNode);
        return;
      }
    }
  
    // If we didn't find an exact match, insert at the position determined by 'left'
    if (left === styleNodes.length) {
      // Insert before the end marker
      endNode.insertAdjacentElement('beforebegin', styleNode);
    } else if (left === 0) {
      // Insert after the start marker
      startNode.insertAdjacentElement('afterend', styleNode);
    } else {
      // Insert before the node at the 'left' index
      styleNodes[left].insertAdjacentElement('beforebegin', styleNode);
    }
  }</script>`
}

export function getJss() {
  return jssCreate({
    plugins: [
      jssGlobal(),
      jssNested(),
      jssCamelCase(),
      jssDefaultUnit(),
      jssVendorPrefixer(),
      jssPropsSort(),
    ],
  });
}


/**
 * Takes a detached style element, and inserts it into the DOM as a child of
 * the `head` element, at a position determined by the precedence-affecting
 * options in `styleDefinition`.
 *
 * Style elements are children of the `head` tag, in between a style tag with ID
 * "jss-insertion-start" and a style tag with ID "jss-insertion-end". They are
 * sorted first by priority, which is both passed to this function as a number
 * and present on all style nodes as a string in the `data-priority` attribute.
 * Styles with the same priority are sorted by name, which is passed as the
 * `name` parameter and is present on the style nodes as the `data-name`
 * attribute.
 */
function insertStyleNodeAtCorrectPosition(styleNode: HTMLStyleElement, name: string, priority: number) {
  const head = document.head;
  const startNode = document.getElementById('jss-insertion-start');
  const endNode = document.getElementById('jss-insertion-end');

  if (!startNode || !endNode) {
    throw new Error('Insertion point markers not found');
  }

  styleNode.setAttribute('data-priority', priority.toString());
  styleNode.setAttribute('data-name', name);

  const styleNodes = Array.from(head.querySelectorAll('style[data-priority]'));
  let left = 0;
  let right = styleNodes.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midNode = styleNodes[mid] as HTMLStyleElement;
    const midPriority = parseInt(midNode.getAttribute('data-priority') || '0', 10);
    const midName = midNode.getAttribute('data-name') || '';
  
    if (midPriority < priority || (midPriority === priority && midName < name)) {
      left = mid + 1;
    } else if (midPriority > priority || (midPriority === priority && midName > name)) {
      right = mid - 1;
    } else {
      // Equal priority and name, insert after this node
      midNode.insertAdjacentElement('afterend', styleNode);
      return;
    }
  }

  // If we didn't find an exact match, insert at the position determined by 'left'
  if (left === styleNodes.length) {
    // Insert before the end marker
    endNode.insertAdjacentElement('beforebegin', styleNode);
  } else if (left === 0) {
    // Insert after the start marker
    startNode.insertAdjacentElement('afterend', styleNode);
  } else {
    // Insert before the node at the 'left' index
    styleNodes[left].insertAdjacentElement('beforebegin', styleNode);
  }
}
