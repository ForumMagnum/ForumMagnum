import React from 'react';
import { JssProvider, SheetsRegistry } from 'react-jss';
import { createGenerateClassName } from '@material-ui/core/styles';
import { getForumTheme } from '../../themes/forumTheme'
import { ThemeContextProvider } from '../../components/themes/useTheme';

export function wrapWithMuiTheme (app: React.ReactNode, context, themeOptions) {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;

  const generateClassName = createGenerateClassName();
  const theme: any = getForumTheme(themeOptions);

  return (
    <JssProvider registry={sheetsRegistry} generateId={generateClassName}>
      <ThemeContextProvider options={themeOptions}>
        {app}
      </ThemeContextProvider>
    </JssProvider>
  );
}

