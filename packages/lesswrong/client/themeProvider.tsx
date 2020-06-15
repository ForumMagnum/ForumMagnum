import React from 'react';
import { addCallback } from '../lib/vulcan-lib';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import forumTheme from '../themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';


export function wrapWithMuiTheme (app) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  return (
    <JssProvider generateClassName={generateClassName}>
      <MuiThemeProvider theme={forumTheme}>
        {app}
        <JssCleanup />
      </MuiThemeProvider>
    </JssProvider>
  );
}
