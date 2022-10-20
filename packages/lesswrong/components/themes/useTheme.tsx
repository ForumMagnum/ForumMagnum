import React, { useState, useMemo, useEffect } from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import type { AbstractThemeOptions, ThemeOptions } from '../../themes/themeNames';
import { MuiThemeProvider } from '@material-ui/core/styles';

type ThemeContextObj = {
  theme: ThemeType,
  setThemeOptions: (options: AbstractThemeOptions)=>void
}
export const ThemeContext = React.createContext<ThemeContextObj|null>(null);

export const useTheme = (): ThemeType => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useTheme() used without the context available";
  return themeContext.theme;
}

export const useSetTheme = () => {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext) throw "useSetTheme() used without the context available";
  return themeContext.setThemeOptions;
}

const buildQuery = () => "window" in globalThis
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }; // TODO: Handle SSR

const abstractThemeToConcrete = (
  theme: AbstractThemeOptions,
  query: {matches: boolean},
): ThemeOptions => theme.name === "auto"
  ? {...theme, name: query.matches ? "dark" : "default"}
  : theme as ThemeOptions;

export const ThemeContextProvider = ({options, children}: {
  options: AbstractThemeOptions,
  children: React.ReactNode,
}) => {
  const [query] = useState(buildQuery());

  const [themeOptions, setThemeOptions] = useState(options);
  const [sheetsManager] = useState(new Map());

  const [concreteTheme, setConcreteTheme] = useState(abstractThemeToConcrete(themeOptions, query));

  useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      setConcreteTheme(abstractThemeToConcrete(themeOptions, event));
    }
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, [themeOptions]);

  const theme: any = useMemo(() =>
    getForumTheme(concreteTheme),
    [concreteTheme]
  );
  const themeContext = useMemo(() => (
    {theme, setThemeOptions}),
    [theme, setThemeOptions]
  );

  return <ThemeContext.Provider value={themeContext}>
    <MuiThemeProvider theme={theme} sheetsManager={sheetsManager}>
      {children}
    </MuiThemeProvider>
  </ThemeContext.Provider>
}
