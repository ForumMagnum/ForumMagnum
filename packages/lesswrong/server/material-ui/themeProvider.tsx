import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import { getForumTheme } from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';

export function wrapWithMuiTheme (app: React.ReactNode, context, themeOptions) {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProvider theme={getForumTheme(themeOptions)} sheetsManager={new Map()}>
        {app}
      </MuiThemeProvider>
    </JssProvider>
  );
}

