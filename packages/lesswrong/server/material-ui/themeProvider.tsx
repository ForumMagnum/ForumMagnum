import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import forumTheme from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';
import JssCleanup from '../../components/themes/JssCleanup';

const MuiThemeProviderWrapper = (props, context) => {
  return <MuiThemeProvider {...props}>
    {props.children}
  </MuiThemeProvider>
}
export function wrapWithMuiTheme (app, context) {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProviderWrapper theme={forumTheme} sheetsManager={new Map()}>
        {app}
        <JssCleanup/>
      </MuiThemeProviderWrapper>
    </JssProvider>
  );
}

