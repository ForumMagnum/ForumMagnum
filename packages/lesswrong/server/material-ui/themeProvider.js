import React from 'react';
import { Components, registerComponent, addCallback, withUser } from 'meteor/vulcan:core';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import { getForumTheme } from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';
import { withCookies } from 'react-cookie'
import PropTypes from 'prop-types'

const ThemeWrapper = ({children, sheetsManager, currentUser, cookies, sheetsRegistry}, context) => {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  const theme = getForumTheme({ user: currentUser, cookies});

  // If isGetDataFromTree is present in the context, suppress generation of JSS
  // styles. See Vulcan/packages/vulcan-lib/lib/server/apollo-ssr/renderPage.js
  // for an explanation of why we're doing this.
  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProvider
        theme={theme}
        sheetsManager={sheetsManager}
        disableStylesGeneration={!!context.isGetDataFromTree}
      >
        {children}
      </MuiThemeProvider>
    </JssProvider>
  )
}
ThemeWrapper.contextTypes = {
  isGetDataFromTree: PropTypes.bool
};
registerComponent("ThemeWrapper", ThemeWrapper, withUser, withCookies);

function wrapWithMuiTheme (app, { context }) {
  const sheetsRegistry = new SheetsRegistry();
  context.sheetsRegistry = sheetsRegistry;
  
  return (
    <Components.ThemeWrapper sheetsManager={new Map()} sheetsRegistry={sheetsRegistry}>
      {app}
    </Components.ThemeWrapper>
  );
}

addCallback('router.server.wrapper', wrapWithMuiTheme);
