import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, ThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import { usePrefersDarkMode } from './usePrefersDarkMode';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { THEME_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import stringify from 'json-stringify-deterministic';
import { FMJssProvider } from '../hooks/FMJssProvider';
// eslint-disable-next-line no-restricted-imports
import { useLocation } from 'react-router-dom';

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

const makeStylesheetUrl = (themeOptions: AbstractThemeOptions) =>
  `/allStyles?theme=${encodeURIComponent(stringify(themeOptions))}`;

type OnFinish = (error?: string | Event) => void;

const addStylesheet = (href: string, id: string, onFinish: OnFinish) => {
  const styleNode = document.createElement("link");
  styleNode.setAttribute("id", id);
  styleNode.setAttribute("rel", "stylesheet");
  styleNode.setAttribute("href", href);
  styleNode.onload = () => {
    onFinish();
  }
  styleNode.onerror = onFinish;
  document.head.appendChild(styleNode);
}

/**
 * The 'auto' stylesheet is an inline style that will automatically import
 * either the light or dark theme based on the device preferences. If the
 * preference changes whilst the site is open, the sheet will automatically
 * be switched.
 */
const addAutoStylesheet = (id: string, onFinish: OnFinish, siteThemeOverride?: SiteThemeOverride) => {
  const light = makeStylesheetUrl({name: "default", siteThemeOverride})
  const dark = makeStylesheetUrl({name: "dark", siteThemeOverride})
  const styleNode = document.createElement("style");
  styleNode.setAttribute("id", id);
  styleNode.innerHTML = `
    @import url("${light}") screen and (prefers-color-scheme: light);
    @import url("${dark}") screen and (prefers-color-scheme: dark);
  `;
  styleNode.onload = () => {
    onFinish();
  }
  styleNode.onerror = onFinish;
  document.head.appendChild(styleNode);
}

export const ThemeContextProvider = ({options, children}: {
  options: AbstractThemeOptions,
  children: React.ReactNode,
}) => {
  const [_cookies, setCookie, removeCookie] = useCookiesWithConsent([THEME_COOKIE]);
  const [themeOptions, setThemeOptions] = useState(options);
  const prefersDarkMode = usePrefersDarkMode();
  const concreteTheme = abstractThemeToConcrete(themeOptions, prefersDarkMode);

  const location = useLocation();
  const isHomePage = location?.pathname === '/' || location?.pathname === '';

  useEffect(() => {
    if (stringify(themeOptions) !== stringify(window.themeOptions)) {
      window.themeOptions = themeOptions;
      if (isEAForum) {
        removeCookie(THEME_COOKIE, {path: "/"});
      } else {
        setCookie(THEME_COOKIE, stringify(themeOptions), {
          path: "/",
          expires: moment().add(2, 'years').toDate(),
        });
      }
      const stylesId = "main-styles";
      const tempStylesId = stylesId + "-temp";
      const oldStyles = document.getElementById(stylesId);
      if (oldStyles) {
        oldStyles.setAttribute("id", tempStylesId);
        const onFinish = (error?: string | Event) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to load stylesheet for theme:", themeOptions, "Error:", error);
          } else {
            oldStyles.parentElement!.removeChild(oldStyles);
          }
        }
        if (themeOptions.name === "auto") {
          addAutoStylesheet(stylesId, onFinish, concreteTheme.siteThemeOverride);
        } else {
          addStylesheet(makeStylesheetUrl(concreteTheme), stylesId, onFinish);
        }
      }
    }
  }, [themeOptions, concreteTheme, setCookie, removeCookie]);

  const theme: any = useMemo(() => {
    if (isHomePage) {
      return getForumTheme({name: 'dark' as const});
    } else {
      return getForumTheme(concreteTheme);
    }
  }, [concreteTheme, isHomePage]);
  
  const themeContext = useMemo(() => {
    if (isHomePage) {
      return {theme, themeOptions: {name: 'dark' as const}, setThemeOptions};
    } else {
      return {theme, themeOptions, setThemeOptions};
    }
  }, [theme, themeOptions, setThemeOptions, isHomePage]);
  
  return <ThemeContext.Provider value={themeContext}>
    <FMJssProvider>
      {children}
    </FMJssProvider>
  </ThemeContext.Provider>
}
