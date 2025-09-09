import React, { useState, useMemo, useEffect, useLayoutEffect, useContext } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { THEME_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import stringify from 'json-stringify-deterministic';
import { ThemeContext } from './useTheme';
import { isClient, isServer } from '@/lib/executionEnvironment';
import { useTracking } from '@/lib/analyticsEvents';
import { createStylesContext, defineStyles, regeneratePageStyles, serverEmbeddedStyles, setClientMountedStyles, StylesContext, useStyles, type StylesContextType } from '../hooks/useStyles';
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

const autoDarkModeWrapperStyles = defineStyles("AutoDarkModeWrapper", theme => ({
  autoColorScheme: {
    "@media (prefers-color-sceme: light)": {
      colorScheme: "only light",
    },
    "@media (prefers-color-sceme: dark)": {
      colorScheme: "only dark",
    },
  },
}));

export const AutoDarkModeWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const themeName = useContext(ThemeContext)?.abstractThemeOptions.name ?? "auto";
  const classes = useStyles(autoDarkModeWrapperStyles);

  if (themeName === "auto") {
    return <div>{children}</div>
  } else if (themeName === "dark") {
    return <div style={{colorScheme: "only dark"}}>{children}</div>
  } else if (themeName === "default") {
    return <div className={classes.autoColorScheme}>{children}</div>
  }
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
