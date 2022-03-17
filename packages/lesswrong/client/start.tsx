import React from 'react';
import ReactDOM from 'react-dom';
import AppGenerator from './AppGenerator';
import { onStartup } from '../lib/executionEnvironment';

import { createApolloClient } from './apolloClient';
import { populateComponentsAppDebug } from '../lib/vulcan-lib';

onStartup(() => {
  populateComponentsAppDebug();
  const apolloClient = createApolloClient();
  apolloClient.disableNetworkFetches = true;

  // Create the root element, if it doesn't already exist.
  if (!document.getElementById('react-app')) {
    const rootElement = document.createElement('div');
    rootElement.id = 'react-app';
    document.body.appendChild(rootElement);
  }

  const Main = () => (
    <AppGenerator apolloClient={apolloClient} abTestGroupsUsed={{}} themeOptions={(window as any).themeOptions} />
  );

  ReactDOM.hydrate(
    <Main />,
    document.getElementById('react-app'),
    () => { // On hydration finished
      apolloClient.disableNetworkFetches = false;
      
      // Remove server-side injected CSS. Material-UI elements (which bypass
      // our styling system and bypass the static stylesheet) put some styles
      // into the page header, and hydration makes a duplicate. This removes
      // the duplicate.
      const jssStyles = document.getElementById('jss-server-side');
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles);
      }
    }
  );
});
