import React, {useState,useMemo} from 'react';
import { getForumTheme } from '../../themes/forumTheme';
import type { ThemeOptions } from '../../themes/themeNames';
import { MuiThemeProvider } from '@material-ui/core/styles';

type ThemeContextObj = {
  theme: ThemeType,
  setThemeOptions: (options: ThemeOptions)=>void
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

export const ThemeContextProvider = ({options, children}: {
  options: ThemeOptions,
  children: React.ReactNode,
}) => {
  const [themeOptions,setThemeOptions] = useState(options);
  const theme: any = useMemo(() => 
    getForumTheme(themeOptions),
    [themeOptions]
  );
  const themeContext = useMemo(() => (
    {theme, setThemeOptions}),
    [theme, setThemeOptions]
  );
  
  return <ThemeContext.Provider value={themeContext}>
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  </ThemeContext.Provider>
}
