import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import { usePrefersDarkMode } from './usePrefersDarkMode';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { THEME_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import stringify from 'json-stringify-deterministic';
import { FMJssProvider } from '../hooks/FMJssProvider';
import { ThemeContext, useThemeOptions } from './useTheme';

export const ThemeContextProvider = ({options, isEmail, children}: {
  options: AbstractThemeOptions,
  isEmail: boolean,
  children: React.ReactNode,
}) => {
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent([THEME_COOKIE]);
  const themeCookie = cookies[THEME_COOKIE];
  const [themeOptions, setThemeOptions] = useState(options);
  const prefersDarkMode = usePrefersDarkMode();

  useEffect(() => {
    if (isEAForum) {
      removeCookie(THEME_COOKIE, {path: "/"});
    } else {
      if (stringify(themeOptions) !== themeCookie) {
        setCookie(THEME_COOKIE, stringify(themeOptions), {
          path: "/",
          expires: moment().add(2, 'years').toDate(),
        });
      }
    }
  }, [themeOptions, themeCookie, setCookie, removeCookie]);
  
  const concreteTheme = abstractThemeToConcrete(themeOptions, prefersDarkMode);

  const theme: any = useMemo(() =>
    getForumTheme(concreteTheme),
    [concreteTheme]
  );
  const themeContext = useMemo(() => (
    {theme, themeOptions, setThemeOptions}),
    [theme, themeOptions, setThemeOptions]
  );
  
  return <ThemeContext.Provider value={themeContext}>
    <FMJssProvider>
      {!isEmail && <ThemeStylesheetSwapper/>}
      {children}
    </FMJssProvider>
  </ThemeContext.Provider>
}

const ThemeStylesheetSwapper = () => {
  const themeOptions = useThemeOptions();
  const prefersDarkMode = usePrefersDarkMode();
  const concreteTheme = abstractThemeToConcrete(themeOptions, prefersDarkMode);

  useLayoutEffect(() => {
    if (stringify(themeOptions) !== stringify(window.themeOptions)) {
      window.themeOptions = themeOptions;
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
  }, [themeOptions, concreteTheme]);
  
  return null;
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
