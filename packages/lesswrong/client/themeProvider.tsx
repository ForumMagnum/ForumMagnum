import React from 'react';
import type { AbstractThemeOptions } from '../themes/themeNames';
import { ThemeContextProvider } from '../components/themes/useTheme';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';

export function wrapWithMuiTheme (app: React.ReactNode, themeOptions: AbstractThemeOptions) {
  return <ThemeContextProvider options={themeOptions}>
    <FMJssProvider>
      {app}
    </FMJssProvider>
  </ThemeContextProvider>
}
