'use client';

import React, { forwardRef } from 'react';
import { AbstractThemeOptions, ThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import { usePrefersDarkMode } from './usePrefersDarkMode';
import { isLW } from '@/lib/instanceSettings';
import { usePathname } from 'next/navigation';
import { HIDE_IF_ANYONE_BUILDS_IT_SPLASH, HIDE_SPOTLIGHT_ITEM_PREFIX } from '@/lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';

type ThemeContextObj = {
  theme: ThemeType,
  themeOptions: AbstractThemeOptions,
  setThemeOptions: (options: AbstractThemeOptions) => void
}
export const ThemeContext = React.createContext<ThemeContextObj|null>(null);

/**
 * You should NOT use the hooks in this file unless you _really_ know what you're doing - in
 * particular, they should never be used for dynamically applying styles/colors/etc. to
 * components as this will have undesired results during SSR where we may or may not know
 * which theme to use if the user has their theme set to "auto". For this use case you should
 * instead use `requireCssVar`.
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

export const useThemeOptions = (): AbstractThemeOptions => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useThemeOptions() used without the context available";
  return themeContext.themeOptions;
}

export const useConcreteThemeOptions = (): ThemeOptions => {
  const prefersDarkMode = usePrefersDarkMode();
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useConcreteThemeOptions() used without the context available";
  return abstractThemeToConcrete(themeContext.themeOptions, prefersDarkMode);
}

export const useSetTheme = () => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useSetTheme() used without the context available";
  return themeContext.setThemeOptions;
}

const IF_ANYONE_BUILDS_IT_DOCUMENT_ID = "khmpWJnGJnuyPdipE";
export const HIDE_IF_ANYONE_BUILDS_IT_SPOTLIGHT = `${HIDE_SPOTLIGHT_ITEM_PREFIX}${IF_ANYONE_BUILDS_IT_DOCUMENT_ID}`; //hiding in one place, hides everywhere

export const useIsThemeOverridden = () => {
  const [cookies] = useCookiesWithConsent([HIDE_IF_ANYONE_BUILDS_IT_SPLASH, HIDE_IF_ANYONE_BUILDS_IT_SPOTLIGHT]);

  const pathname = usePathname();
  const isFrontPage = location?.pathname === '/' || location?.pathname === '';
  return isLW && isFrontPage && !cookies[HIDE_IF_ANYONE_BUILDS_IT_SPLASH] && !cookies[HIDE_IF_ANYONE_BUILDS_IT_SPOTLIGHT];
}
