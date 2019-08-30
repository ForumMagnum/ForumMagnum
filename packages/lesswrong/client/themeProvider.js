import React from 'react';
import { addCallback } from 'meteor/vulcan:core';
import { StylesProvider } from '@material-ui/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { createGenerateClassName } from '@material-ui/styles';
import forumTheme from '../themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';


function wrapWithMuiTheme (app) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  return (
    <StylesProvider generateClassName={generateClassName}>
      <MuiThemeProvider theme={forumTheme}>
        <JssCleanup>
          {app}
        </JssCleanup>
      </MuiThemeProvider>
    </StylesProvider>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
