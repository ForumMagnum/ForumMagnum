import React, { useReducer } from 'react';
import AppGenerator from './AppGenerator';

import { createApolloClient } from './apolloClient';
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { populateComponentsAppDebug } from '@/lib/vulcan-lib/importAllComponents';
import { initServerSentEvents } from "./serverSentEventsClient";
import { hydrateRoot } from 'react-dom/client';

export function hydrateClient() {
  populateComponentsAppDebug();
  initServerSentEvents();
  const apolloClient = createApolloClient();
  apolloClient.prioritizeCacheValues = true;
  const foreignApolloClient = createApolloClient(fmCrosspostBaseUrlSetting.get() ?? "/");

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
      foreignApolloClient={foreignApolloClient}
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

  setTimeout(() => {
    // apolloClient.prioritizeCacheValues causes the `cache-and-network` fetch
    // mode to be treated as `cache-first`. In the short time after SSR, this
    // prevents duplicate fetches. We use `cache-and-network` for things that
    // might be in the cache, btu which we want to ensure are refetched after a
    // navigation because they change (eg comments on posts, because there
    // could be new ones); if it's too soon after SSR, this isn't an issue.
    //
    // Under apollo-client 3.x and eaerlier, this was instead handled with the
    // `ssrForceFetchDelay` and `disableNetworkFetches`, with the complication
    // that if the option was left on too long, not-in-cache queries wouldn't
    // run at all (which is pretty bad). That is no longer an issue in
    // apollo-client 4.x.
    apolloClient.prioritizeCacheValues = false;
  }, 3000);
};


let _forceFullRerender: (() => void)|null = null;
export function forceFullReactRerender() {
  _forceFullRerender?.();
}
