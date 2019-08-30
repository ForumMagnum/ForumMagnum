import React from 'react';
import { addCallback } from 'meteor/vulcan:core';
import { StylesProvider } from '@material-ui/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { createGenerateClassName } from '@material-ui/styles';
import forumTheme from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';
import JssCleanup from '../../components/themes/JssCleanup';
import PropTypes from 'prop-types'

const MuiThemeProviderWrapper = (props, context) => {
  // If isGetDataFromTree is present in the context, suppress generation of JSS
  // styles. See Vulcan/packages/vulcan-lib/lib/server/apollo-ssr/renderPage.js
  // for an explanation of why we're doing this.
  return <MuiThemeProvider {...props} disableStylesGeneration={!!context.isGetDataFromTree}>
    {props.children}
  </MuiThemeProvider>
}
MuiThemeProviderWrapper.contextTypes = {
  isGetDataFromTree: PropTypes.bool
};

function wrapWithMuiTheme (app, { context }) {
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <StylesProvider generateClassName={generateClassName}>
      <MuiThemeProviderWrapper theme={forumTheme} sheetsManager={new Map()}>
        <JssCleanup>
          {app}
        </JssCleanup>
      </MuiThemeProviderWrapper>
    </StylesProvider>
  );
}

addCallback('router.server.wrapper', wrapWithMuiTheme);
