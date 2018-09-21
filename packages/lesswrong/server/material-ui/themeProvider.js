import React from 'react';
import { addCallback } from 'meteor/vulcan:core';
import JssProvider from 'react-jss/lib/JssProvider';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import forumTheme from '../../themes/forumTheme'
import { SheetsRegistry } from 'react-jss/lib/jss';
import JssCleanup from '../../components/themes/JssCleanup';

const MuiThemeProviderWrapper = (props, context) => {
  // By experimentation, it turns out that context.client is only available to this component
  // during the initial `getDataFromTree` render, during which we want to skip
  // style-generation. See https://github.com/mui-org/material-ui/issues/8522
  return <MuiThemeProvider {...props} disableStylesGeneration={!!context.client}>
    {props.children}
  </MuiThemeProvider>
}

function wrapWithMuiTheme (app, { req, res, store, apolloClient }) {
  const sheetsRegistry = new SheetsRegistry();
  req.sheetsRegistry = sheetsRegistry;
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });

  return (
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProviderWrapper theme={forumTheme} sheetsManager={new Map()}>
        <JssCleanup>
          {app}
        </JssCleanup>
      </MuiThemeProviderWrapper>
    </JssProvider>
  );
}


function injectJss ({ req, res }) {
  const sheets = req.sheetsRegistry.toString();
  req.dynamicHead = req.dynamicHead || '';
  req.dynamicHead += `<style id="jss-server-side">${sheets}</style>`;
}


addCallback('router.server.wrapper', wrapWithMuiTheme);
addCallback('router.server.postRender', injectJss);
