'use client';

import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ThemeContext } from '@/components/themes/useTheme';
import { FMJssProvider, usePrefersDarkMode } from '@/components/themes/ThemeContextProvider';
import { createStylesContext, defineStyles, regeneratePageStyles, useStyles } from '@/components/hooks/useStyles';
import { globalFontFaces } from '@/themes/globalStyles/externalStyles';
import { getForumTheme } from '@/themes/forumTheme';
import { abstractThemeToConcrete, type AbstractThemeOptions } from '@/themes/themeNames';

const autoThemeOptions: AbstractThemeOptions = { name: 'auto' };

const noopSetThemeOptions = () => {};

const fontStyles = defineStyles('SimpleModFonts', () => ({
  '@global': {
    '@font-face': globalFontFaces,
  },
}));

const LWFonts = () => {
  useStyles(fontStyles);
  return null;
};

const LWThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const prefersDarkMode = usePrefersDarkMode();
  const concreteThemeOptions = useMemo(
    () => abstractThemeToConcrete(autoThemeOptions, prefersDarkMode),
    [prefersDarkMode],
  );
  const themeContext = useMemo(() => ({
    theme: getForumTheme(concreteThemeOptions),
    abstractThemeOptions: autoThemeOptions,
    concreteThemeOptions,
    setThemeOptions: noopSetThemeOptions,
  }), [concreteThemeOptions]);
  const [stylesContext] = useState(() => createStylesContext(themeContext.theme, autoThemeOptions));

  useLayoutEffect(() => {
    regeneratePageStyles(themeContext, stylesContext);
  }, [themeContext, stylesContext]);

  return (
    <ThemeContext.Provider value={themeContext}>
      <FMJssProvider stylesContext={stylesContext}>
        <LWFonts />
        {children}
      </FMJssProvider>
    </ThemeContext.Provider>
  );
};

export default LWThemeProvider;
