"use client"

import React, { createContext, useContext, useLayoutEffect } from "react";
import type { ClassNameProxy, StyleDefinition, StyleOptions } from "@/server/styleGeneration";
import type { JssStyles } from "@/lib/jssStyles";
import { create as jssCreate, SheetsRegistry } from "jss";
import { jssPreset } from "@material-ui/core/styles";
import { isClient } from "@/lib/executionEnvironment";

export type StylesContextType = {
  theme: ThemeType
  mountedStyles: Map<string, {
    refcount: number
    styleDefinition: StyleDefinition<any>
    styleNode: HTMLStyleElement
  }>
  addStyle: (style: StyleDefinition) => void
}

export const StylesContext = createContext<StylesContextType|null>(null);

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

export const defineStyles = <T extends string>(
  name: string,
  styles: (theme: ThemeType) => JssStyles<T>,
  options?: StyleOptions
): StyleDefinition<T> => {
  const definition: StyleDefinition<T> = {
    name,
    styles,
    options,
    nameProxy: null,
  };
  topLevelStyleDefinitions[name] = definition;
  
  if (isClient && _clientMountedStyles) {
    const mountedStyles = _clientMountedStyles.mountedStyles.get(name);
    if (mountedStyles) {
      mountedStyles.styleNode.remove();
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
      mountedStyleNode.styleNode.remove();
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
      mountedStyle.styleNode.remove();
      context.mountedStyles.delete(name);
    }
  }
}

export const useStyles = <T extends string>(styles: StyleDefinition<T>): JssStyles<T> => {
  const stylesContext = useContext(StylesContext);

  if (bundleIsServer) {
    stylesContext?.addStyle(styles);
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
  return styles.nameProxy;
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


function createAndInsertStyleNode(theme: ThemeType, styleDefinition: StyleDefinition): HTMLStyleElement {
  const stylesStr = styleNodeToString(theme, styleDefinition);
  const styleNode = document.createElement("style");
  styleNode.append(document.createTextNode(stylesStr));
  styleNode.setAttribute("data-name", styleDefinition.name);
  styleNode.setAttribute("data-priority", styleDefinition.name);
  insertStyleNodeAtCorrectPosition(styleNode, styleDefinition.name, styleDefinition.options?.stylePriority ?? 0);
  return styleNode;
}

export function styleNodeToString(theme: ThemeType, styleDefinition: StyleDefinition): string {
  const sheets = new SheetsRegistry()
  
  const jss = jssCreate({
    ...jssPreset(),
    virtual: true,
  })
  const sheet = jss.createStyleSheet(
    styleDefinition.styles(theme), {
      classNamePrefix: styleDefinition.name,
      generateClassName: (r,s) => {
        return `${styleDefinition.name}-${(r as any).key}`
      }
    }
  );
  sheets.add(sheet)
  sheet.attach();
  const str = sheets.toString();
  return str;
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
