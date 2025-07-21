import React, { useState, useMemo, useEffect, useLayoutEffect, useContext } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { THEME_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import stringify from 'json-stringify-deterministic';
import { ThemeContext, useTheme, useThemeOptions } from './useTheme';
import { isClient, isServer } from '@/lib/executionEnvironment';
import { useTracking } from '@/lib/analyticsEvents';
import { createStylesContext, regeneratePageStyles, serverEmbeddedStyles, setClientMountedStyles, StylesContext, type StylesContextType } from '../hooks/useStyles';
import { useServerInsertedHtml } from '../hooks/useServerInsertedHtml';

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
  
  const concreteThemeOptions = abstractThemeToConcrete(themeOptions, prefersDarkMode);

  const theme: any = useMemo(() =>
    getForumTheme(concreteThemeOptions),
    [concreteThemeOptions]
  );
  const themeContext = useMemo(() => (
    {theme, abstractThemeOptions: themeOptions, concreteThemeOptions, setThemeOptions}),
    [theme, themeOptions, concreteThemeOptions, setThemeOptions]
  );
  
  const [stylesContext] = useState(() => createStylesContext(theme, themeOptions));
  
  return <ThemeContext.Provider value={themeContext}>
    <FMJssProvider stylesContext={stylesContext}>
      {isClient && <ThemeStylesheetSwapper/>}
      {isServer && !isEmail && <StyleHTMLInjector/>}
      {children}
    </FMJssProvider>
  </ThemeContext.Provider>
}

export const FMJssProvider = ({stylesContext, children}: {
  stylesContext: StylesContextType
  children: React.ReactNode
}) => {
  if (isClient) {
    setClientMountedStyles(stylesContext);
  }
  
  return <StylesContext.Provider value={stylesContext}>
    {children}
  </StylesContext.Provider>
}


const ThemeStylesheetSwapper = () => {
  const themeContext = useContext(ThemeContext)!;
  const stylesContext = useContext(StylesContext)!;
  const abstractThemeOptions = themeContext!.abstractThemeOptions;

  useLayoutEffect(() => {
    if (stringify(abstractThemeOptions) !== stringify(window.themeOptions)) {
      window.themeOptions = abstractThemeOptions;
      regeneratePageStyles(themeContext, stylesContext);
    }
  }, [abstractThemeOptions, themeContext, stylesContext]);
  
  return null;
}

const StyleHTMLInjector = () => {
  const stylesContext = useContext(StylesContext)!;
  const themeContext = useContext(ThemeContext)!;
  
  useServerInsertedHtml(() => {
    if (stylesContext.stylesAwaitingServerInjection.length > 0) {
      const injectedStyles = serverEmbeddedStyles(themeContext.abstractThemeOptions, stylesContext.stylesAwaitingServerInjection)
      stylesContext.stylesAwaitingServerInjection = [];
      return injectedStyles;
    }
    return null;
  });
  
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



const buildPrefersDarkModeQuery = () =>
  isClient && "matchMedia" in window
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

export const usePrefersDarkMode = () => {
  const [query] = useState(() => buildPrefersDarkModeQuery());
  const [prefersDarkMode, setPrefersDarkMode] = useState(query.matches);
  const { captureEvent } = useTracking();

  useEffect(() => {
    const handler = ({matches}: MediaQueryListEvent) => {
      setPrefersDarkMode(matches);
      captureEvent("prefersDarkModeChange", {
        prefersDarkMode: matches,
      });
    }
    // Check that query.addEventListener exists before using it, because on
    // some browsers (older iOS Safari) it doesn't.
    if (query.addEventListener) {
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
    }
  }, [query, captureEvent]);
  
  return prefersDarkMode;
}

export const devicePrefersDarkMode = () => {
  const query = buildPrefersDarkModeQuery();
  return query?.matches ?? false;
}
