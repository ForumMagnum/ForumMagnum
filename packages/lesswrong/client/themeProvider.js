import React from 'react';
import { addCallback, getSetting } from 'meteor/vulcan:core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import forumTheme from '../themes/forumTheme';
import JssCleanup from '../components/themes/JssCleanup';


function wrapWithMuiTheme (app) {
  return (
    <MuiThemeProvider theme={forumTheme}>
      <JssCleanup>
        {app}
      </JssCleanup>
    </MuiThemeProvider>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
