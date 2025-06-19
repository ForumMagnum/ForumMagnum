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
import { ThemeContext, useIsThemeOverridden, useThemeOptions } from './useTheme';
import { defineStyles } from '../hooks/useStyles';

export const ThemeContextProvider = ({options, isEmail, children}: {
  options: AbstractThemeOptions,
  isEmail: boolean,
  children: React.ReactNode,
}) => {
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent([THEME_COOKIE]);
  const themeCookie = cookies[THEME_COOKIE];
  const [themeOptions, setThemeOptions] = useState(options);
  const prefersDarkMode = usePrefersDarkMode();
  
  // This is safe despite breaking hook rules because the isEmail prop never changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const themeIsOverridden = !isEmail && useIsThemeOverridden();

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
  
  const overriddenThemeOptions = useMemo(() => themeIsOverridden
    ? {name: "dark"} as const
    : themeOptions,
    [themeOptions, themeIsOverridden]
  );
  const concreteTheme = abstractThemeToConcrete(overriddenThemeOptions, prefersDarkMode);

  const theme: any = useMemo(() =>
    getForumTheme(concreteTheme),
    [concreteTheme]
  );
  const themeContext = useMemo(() => (
    {theme, themeOptions: overriddenThemeOptions, setThemeOptions}),
    [theme, overriddenThemeOptions, setThemeOptions]
  );
  
  return <ThemeContext.Provider value={themeContext}>
    <FMJssProvider>
      {!isEmail && <ThemeStylesheetSwapper/>}
      {children}
    </FMJssProvider>
  </ThemeContext.Provider>
}

const styles = defineStyles("ThemeStylesheetSwapper", () => ({
  "@global": {
    "body.themeChangeLoadingDark": {
      background: "black",
      "& > *": {
        display: "none",
      }
    },
    "body.themeChangeLoadingLight": {
      background: "white",
      "& > *": {
        display: "none",
      }
    },
  },
}), {allowNonThemeColors: true});

const ThemeStylesheetSwapper = () => {
  const themeOptions = useThemeOptions();
  const prefersDarkMode = usePrefersDarkMode();
  const concreteTheme = abstractThemeToConcrete(themeOptions, prefersDarkMode);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
          document.body.classList.remove("themeChangeLoadingDark");
          document.body.classList.remove("themeChangeLoadingLight");
        }

        if (isFirstLoad) {
          setIsFirstLoad(false);
        } else {
          if (themeOptions.name === 'dark') {
            document.body.classList.add("themeChangeLoadingDark");
          } else {
            document.body.classList.add("themeChangeLoadingLight");
          }
        }
        if (themeOptions.name === "auto") {
          addAutoStylesheet(stylesId, onFinish, concreteTheme.siteThemeOverride);
        } else {
          addStylesheet(makeStylesheetUrl(concreteTheme), stylesId, onFinish);
        }
      }
    }
  }, [themeOptions, concreteTheme, isFirstLoad]);
  
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
