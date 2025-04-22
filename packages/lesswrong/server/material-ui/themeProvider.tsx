import React from 'react';
import { ThemeContextProvider } from '../../components/themes/useTheme';
import { AbstractThemeOptions } from '../../themes/themeNames';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';

export const wrapWithMuiTheme = (
  app: React.ReactNode,
  themeOptions: AbstractThemeOptions,
): React.ReactElement => {
  return <ThemeContextProvider options={themeOptions}>
    <FMJssProvider>
      {app}
    </FMJssProvider>
  </ThemeContextProvider>
}
