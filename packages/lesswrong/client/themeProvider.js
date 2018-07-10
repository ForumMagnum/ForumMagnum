import React from 'react';
import { addCallback, getSetting } from 'meteor/vulcan:core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import lwTheme from '../themes/lesswrongTheme';
import afTheme from '../themes/alignmentForumTheme';
import JssCleanup from '../components/themes/JssCleanup';


function wrapWithMuiTheme (app) {
  return (
    <MuiThemeProvider theme={getSetting('AlignmentForum', false) ? afTheme : lwTheme}>
      <JssCleanup>
        {app}
      </JssCleanup>
    </MuiThemeProvider>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
