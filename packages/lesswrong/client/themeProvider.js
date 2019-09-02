import React from 'react';
import { Components, registerComponent, addCallback, withUser } from 'meteor/vulcan:core';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import { getForumTheme } from '../themes/forumTheme';
import { withCookies } from 'react-cookie'

const ThemeWrapper = ({children, currentUser, cookies}) => {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  const theme = getForumTheme({ user: currentUser, cookies});
  
  return (
    <JssProvider generateClassName={generateClassName}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </JssProvider>
  );
}
registerComponent("ThemeWrapper", ThemeWrapper, withUser, withCookies);

function wrapWithMuiTheme (app) {
  return (
    <Components.ThemeWrapper>
      {app}
    </Components.ThemeWrapper>
  );
}


addCallback('router.client.wrapper', wrapWithMuiTheme);
