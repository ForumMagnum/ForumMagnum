import React, { useReducer } from 'react';
import AppGenerator from './AppGenerator';
import { createApolloClient } from './apolloClient';
import { populateComponentsAppDebug } from '../lib/vulcan-lib/components';
import { initServerSentEvents } from "./serverSentEventsClient";
import { hydrateRoot } from 'react-dom/client';

export function hydrateClient() {
  populateComponentsAppDebug();
  initServerSentEvents();
  const apolloClient = createApolloClient();

  // Create the root element, if it doesn't already exist.
  if (!document.getElementById('react-app')) {
    const rootElement = document.createElement('div');
    rootElement.id = 'react-app';
    document.body.appendChild(rootElement);
  }

  const Main = () => {
    const [renderCount, forceRerender] = useReducer(c => c+1, 0);
    _forceFullRerender = forceRerender;

    return <AppGenerator
      key={renderCount}
      apolloClient={apolloClient}
      abTestGroupsUsed={{}}
      themeOptions={window.themeOptions}
      ssrMetadata={window.ssrMetadata}
    />
  };

  hydrateRoot(
    document.getElementById('react-app')!,
    <Main />,
  );
  setTimeout(() => {
    // Remove the SSR interaction disable styles (which are only added in E2E
    // tests) - see `apolloServer.ts`
    document.getElementById("ssr-interaction-disable")?.remove();
  });
};


let _forceFullRerender: (() => void)|null = null;
export function forceFullReactRerender() {
  _forceFullRerender?.();
}
