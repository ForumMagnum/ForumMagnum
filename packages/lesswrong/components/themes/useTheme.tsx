import React, { useState, useMemo, useEffect } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import { AbstractThemeOptions, ThemeOptions, themeOptionsAreConcrete } from '../../themes/themeNames';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { usePrefersDarkMode } from './usePrefersDarkMode';

type ThemeContextObj = {
  theme: ThemeType,
  themeOptions: AbstractThemeOptions,
  setThemeOptions: (options: AbstractThemeOptions)=>void
}
export const ThemeContext = React.createContext<ThemeContextObj|null>(null);

export const useTheme = (): ThemeType => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useTheme() used without the context available";
  return themeContext.theme;
}

export const useThemeOptions = (): AbstractThemeOptions => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useThemeOptions() used without the context available";
  return themeContext.themeOptions;
}

export const useSetTheme = () => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useSetTheme() used without the context available";
  return themeContext.setThemeOptions;
}

export const abstractThemeToConcrete = (
  theme: AbstractThemeOptions,
  prefersDarkMode: boolean,
): ThemeOptions => themeOptionsAreConcrete(theme)
  ? theme
  : {...theme, name: prefersDarkMode ? "dark" : "default"};

const removeStylesheetsMatching = (substring: string) => {
  const linkTags = document.getElementsByTagName("link");
  for (let i = 0; i < linkTags.length; i++) {
    if (linkTags[i].getAttribute("rel") === "stylesheet") {
      const href = linkTags[i].getAttribute("href");
      if (href && href.indexOf(substring) >= 0) {
        linkTags[i].parentElement!.removeChild(linkTags[i]);
        break;
      }
    }
  }
}

type OnFinish = (error?: string | Event) => void;

const addStylesheet = (href: string, onFinish: OnFinish) => {
  const styleNode = document.createElement("link");
  styleNode.setAttribute("rel", "stylesheet");
  styleNode.setAttribute("href", href);
  styleNode.onload = () => {
    onFinish();
  }
  styleNode.onerror = onFinish;
  document.head.appendChild(styleNode);
}

const addThemeStylesheet = (themeOptions: ThemeOptions, onFinish: OnFinish) => {
  const serializedThemeOptions = JSON.stringify(themeOptions);
  window.themeOptions = themeOptions;
  addStylesheet(`/allStyles?theme=${encodeURIComponent(serializedThemeOptions)}`, onFinish);
}

export const ThemeContextProvider = ({options, children}: {
  options: AbstractThemeOptions,
  children: React.ReactNode,
}) => {
  const [themeOptions, setThemeOptions] = useState(options);
  const [sheetsManager] = useState(new Map());
  const prefersDarkMode = usePrefersDarkMode();
  const concreteTheme = abstractThemeToConcrete(themeOptions, prefersDarkMode)

  useEffect(() => {
    const serializedThemeOptions = JSON.stringify(concreteTheme);
    if (serializedThemeOptions !== JSON.stringify(window?.themeOptions)) {
      const oldThemeOptions = window.themeOptions;
      addThemeStylesheet(concreteTheme, (error?: string | Event) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to load stylesheet for theme:", concreteTheme, "Error:", error);
        } else {
          removeStylesheetsMatching(encodeURIComponent(JSON.stringify(oldThemeOptions)));
        }
      });
    }
  }, [themeOptions, concreteTheme]);

  const theme: any = useMemo(() =>
    getForumTheme(concreteTheme),
    [concreteTheme]
  );
  const themeContext = useMemo(() => (
    {theme, themeOptions, setThemeOptions}),
    [theme, themeOptions, setThemeOptions]
  );

  return <ThemeContext.Provider value={themeContext}>
    <MuiThemeProvider theme={theme} sheetsManager={sheetsManager}>
      {children}
    </MuiThemeProvider>
  </ThemeContext.Provider>
}
