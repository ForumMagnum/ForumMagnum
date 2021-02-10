import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import { getForumTheme } from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';
import JssCleanup from '../../components/themes/JssCleanup';

const MuiThemeProviderWrapper = (props, context) => {
  return <MuiThemeProvider {...props}>
    {props.children}
  </MuiThemeProvider>
}
export function wrapWithMuiTheme (app, context, themeOptions) {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProviderWrapper theme={getForumTheme(themeOptions)} sheetsManager={new Map()}>
        {app}
        <JssCleanup/>
      </MuiThemeProviderWrapper>
    </JssProvider>
  );
}

