import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { ThemeContextProvider } from '../../components/themes/useTheme';
import { AbstractThemeOptions } from '../../themes/themeNames';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';
import { createGenerateClassName } from "@/components/mui-replacement";

export const wrapWithMuiTheme = <Context extends {sheetsRegistry?: typeof SheetsRegistry}>(
  app: React.ReactNode,
  context: Context,
  themeOptions: AbstractThemeOptions,
): React.ReactElement => {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
    <ThemeContextProvider options={themeOptions}>
      <FMJssProvider>
        {app}
      </FMJssProvider>
    </ThemeContextProvider>
    </JssProvider>
  );
}
