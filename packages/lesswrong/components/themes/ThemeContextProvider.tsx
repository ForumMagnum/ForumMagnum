'use client';

import React, { useState, useMemo, useEffect, useLayoutEffect, useContext } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, abstractThemeToConcrete } from '../../themes/themeNames';
import { usePrefersDarkMode } from './usePrefersDarkMode';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { THEME_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import stringify from 'json-stringify-deterministic';
import { ThemeContext, useTheme } from './useTheme';
import { StylesContext, topLevelStyleDefinitions } from '../hooks/useStyles';
import { createAndInsertStyleNode } from '@/lib/jssStyles';

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
    {!isEmail && <ThemeStylesheetSwapper/>}
    {children}
  </ThemeContext.Provider>
}

const ThemeStylesheetSwapper = () => {
  const stylesContext = useContext(StylesContext);
  const theme = useTheme();

  useLayoutEffect(() => {
    if (stringify(theme.themeOptions) !== stringify(window.themeOptions)) {
      window.themeOptions = theme.themeOptions;

      // Get all style elements which have both a data-name and data-theme-name attribute
      const oldStyleElements = document.querySelectorAll('style[data-name][data-theme-name]');

      oldStyleElements.forEach(style => {
        if (style.getAttribute("data-theme-name") !== theme.themeOptions.name) {
          const styleName = style.getAttribute("data-name");
          const styleDefinition = topLevelStyleDefinitions[styleName!];
          if (theme && styleDefinition) {
            style.remove();
            createAndInsertStyleNode(theme, styleDefinition);
          }
        }
      });

      if (stylesContext) {
        stylesContext.theme = theme;
      }
    }
  }, [theme]);
  
  return null;
}
