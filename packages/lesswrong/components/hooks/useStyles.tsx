'use client';

import React, { createContext, forwardRef, useContext, useLayoutEffect } from "react";
import type { ClassNameProxy, StyleDefinition, StyleOptions } from "@/server/styleGeneration";
import type { JssStyles } from "@/lib/jssStyles";
import { useTheme } from "../themes/useTheme";
import { createAndInsertStyleNode } from "@/lib/jssStyles";
import { isClient } from "@/lib/executionEnvironment";

export type StylesContextType = {
  theme: ThemeType
  mountedStyles: Map<string, {
    refcount: number
    styleDefinition: StyleDefinition<any>
    styleNode?: HTMLStyleElement
  }>
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

  // @ts-ignore
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

  // @ts-ignore
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


