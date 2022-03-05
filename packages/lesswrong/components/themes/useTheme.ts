import React from 'react';
import { getForumTheme } from '../../themes/forumTheme';

export const ThemeContext = React.createContext<ThemeType|null>(null);

export const useTheme = (): ThemeType => {
  const theme = React.useContext(ThemeContext);
  if (!theme) throw "useTheme() used without the context available";
  return theme!;
}
