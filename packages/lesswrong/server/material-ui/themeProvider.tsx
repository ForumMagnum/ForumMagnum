import React from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
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

