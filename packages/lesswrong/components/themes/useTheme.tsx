'use client';

import React, { forwardRef } from 'react';
import { AbstractThemeOptions, abstractThemeToConcrete, ThemeOptions } from '../../themes/themeNames';
import { getForumTheme } from '@/themes/forumTheme';

export type ThemeContextType = {
  theme: ThemeType,
  abstractThemeOptions: AbstractThemeOptions,
  concreteThemeOptions: ThemeOptions,
  setThemeOptions: (options: AbstractThemeOptions) => void
}
export const ThemeContext = React.createContext<ThemeContextType|null>(null);

/**
 * You should NOT use the hooks in this file unless you _really_ know what you're doing - in
 * particular, they should never be used for dynamically applying styles/colors/etc. to
 * components as this will have undesired results during SSR where we may or may not know
 * which theme to use if the user has their theme set to "auto". For this use case you should
 * instead use `useThemeColor`.
 */
export const useTheme = (): ThemeType => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useTheme() used without the context available";
  return themeContext.theme;
}

export const withTheme = <T extends {theme: ThemeType}>(Component: React.ComponentType<T>) => {
  return forwardRef((props, ref) => {
    const theme = useTheme();
    const ComponentUntyped = Component as any;
    return <ComponentUntyped ref={ref} {...props} theme={theme}/>
  }) as React.ComponentType<Omit<T,"theme">>;
}

export const useAbstractThemeOptions = (): AbstractThemeOptions => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useConcreteThemeOptions() used without the context available";
  return themeContext.abstractThemeOptions;
}

export const useConcreteThemeOptions = (): ThemeOptions => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useConcreteThemeOptions() used without the context available";
  return themeContext.concreteThemeOptions;
}

export const useSetTheme = () => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useSetTheme() used without the context available";
  return themeContext.setThemeOptions;
}

export const useThemeColor = (fn: (theme: ThemeType) => string) => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("No theme context");
  } else if (themeContext.abstractThemeOptions.name === 'auto') {
    const lightThemeOptions = abstractThemeToConcrete(themeContext.abstractThemeOptions, false);
    const darkThemeOptions = abstractThemeToConcrete(themeContext.abstractThemeOptions, true);
    const lightTheme = getForumTheme(lightThemeOptions);
    const darkTheme = getForumTheme(darkThemeOptions);
    const lightModeColor = fn(lightTheme);
    const darkModeColor = fn(darkTheme);
    return `light-dark(${lightModeColor},${darkModeColor})`;
  } else {
    return fn(themeContext.theme);
  }
}
