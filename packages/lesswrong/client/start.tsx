import React from 'react';
import AppGenerator from './AppGenerator';

import { createApolloClient } from './apolloClient';
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { populateComponentsAppDebug } from '../lib/vulcan-lib';
import { initServerSentEvents } from "./serverSentEventsClient";
import { hydrateRoot } from 'react-dom/client';

export function hydrateClient() {
  populateComponentsAppDebug();
  initServerSentEvents();
  const apolloClient = createApolloClient();
  apolloClient.disableNetworkFetches = true;
  const foreignApolloClient = createApolloClient(fmCrosspostBaseUrlSetting.get() ?? "/");
  foreignApolloClient.disableNetworkFetches = true;

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
      ssrMetadata={window.ssrMetadata}
    />
  );

  const root = hydrateRoot(
    document.getElementById('react-app')!,
    <Main />,
  );
  setTimeout(() => {
    apolloClient.disableNetworkFetches = false;
    foreignApolloClient.disableNetworkFetches = false;
  });
};
