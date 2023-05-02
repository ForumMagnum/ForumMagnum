import React from 'react';
import ReactDOM from 'react-dom';
import AppGenerator from './AppGenerator';
import { onStartup } from '../lib/executionEnvironment';
import type { TimeOverride } from '../lib/utils/timeUtil';

import { createApolloClient } from './apolloClient';
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { populateComponentsAppDebug } from '../lib/vulcan-lib';

onStartup(() => {
  populateComponentsAppDebug();
  const apolloClient = createApolloClient();
  apolloClient.disableNetworkFetches = true;
  const foreignApolloClient = createApolloClient(fmCrosspostBaseUrlSetting.get() ?? "/");
  foreignApolloClient.disableNetworkFetches = true;

  const ssrRenderedAt: Date = new Date(window.ssrRenderedAt);
  const timeOverride: TimeOverride = {currentTime: ssrRenderedAt};

  // Create the root element, if it doesn't already exist.
  if (!document.getElementById('react-app')) {
    const rootElement = document.createElement('div');
    rootElement.id = 'react-app';
    document.body.appendChild(rootElement);
  }

  const Main = () => (
    <AppGenerator
      apolloClient={apolloClient}
      foreignApolloClient={foreignApolloClient}
      abTestGroupsUsed={{}}
      themeOptions={window.themeOptions}
      timeOverride={timeOverride}
    />
  );

  ReactDOM.hydrate(
    <Main />,
    document.getElementById('react-app'),
    () => {
      apolloClient.disableNetworkFetches = false;
      foreignApolloClient.disableNetworkFetches = false;
      timeOverride.currentTime = null;
    }
  );
// Order 100 to make this execute last
}, 100);
