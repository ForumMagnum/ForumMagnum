import React from 'react';
import { getForumTheme } from '@/themes/forumTheme';
import { ThemeOptions } from '@/themes/themeNames';
import { ThemeContext } from '@/components/themes/ThemeContext';
import { StylesContext } from '@/components/hooks/useStyles';
import { createStylesContext } from '@/lib/styleHelpers';

export const EmailThemeProvider = ({ 
  options, 
  children 
}: {
  options: ThemeOptions;
  children: React.ReactNode;
}) => {
  const theme = getForumTheme(options);
  
  // Server-side theme context without any hooks
  const themeContext = {
    theme,
    abstractThemeOptions: options,
    concreteThemeOptions: options,
    setThemeOptions: () => {} // No-op for emails
  };

  const stylesContext = createStylesContext(theme, options);
  
  return (
    <ThemeContext.Provider value={themeContext}>
      <StylesContext.Provider value={stylesContext}>
        {children}
      </StylesContext.Provider>
    </ThemeContext.Provider>
  );
};
