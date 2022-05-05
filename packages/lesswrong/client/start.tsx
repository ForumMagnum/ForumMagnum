import React from 'react';
import ReactDOM from 'react-dom';
import AppGenerator from './AppGenerator';
import { onStartup } from '../lib/executionEnvironment';
import type { TimeOverride } from '../lib/utils/timeUtil';

import { createApolloClient } from './apolloClient';
import { populateComponentsAppDebug } from '../lib/vulcan-lib';

onStartup(() => {
  populateComponentsAppDebug();
  const apolloClient = createApolloClient();
  apolloClient.disableNetworkFetches = true;
  
  const ssrRenderedAt: Date = (window as any).ssrRenderedAt;
  const timeOverride: TimeOverride = {currentTime: ssrRenderedAt};

  // Create the root element, if it doesn't already exist.
  if (!document.getElementById('react-app')) {
    const rootElement = document.createElement('div');
    rootElement.id = 'react-app';
    document.body.appendChild(rootElement);
  }

  const Main = () => (
    <AppGenerator apolloClient={apolloClient} abTestGroupsUsed={{}} timeOverride={timeOverride}/>
  );
  
  ReactDOM.hydrate(
    <Main />,
    document.getElementById('react-app'),
    () => {
      apolloClient.disableNetworkFetches = false;
    }
  );
});
