import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { createGenerateClassName } from '@material-ui/core/styles';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { ThemeContextProvider } from '../../components/themes/useTheme';
import { AbstractThemeOptions } from '../../themes/themeNames';

export const wrapWithMuiTheme = <Context extends {sheetsRegistry?: SheetsRegistry}>(
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
        {app}
      </ThemeContextProvider>
    </JssProvider>
  );
}

