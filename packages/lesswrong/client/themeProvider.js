import React from 'react';
import { addCallback } from 'meteor/vulcan:core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from '../themes/lesswrongTheme';
import JssCleanup from '../components/themes/JssCleanup';


function wrapWithMuiTheme (app) {
  return (
    <MuiThemeProvider theme={theme}>
      <JssCleanup>
        {app}
      </JssCleanup>
    </MuiThemeProvider>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
