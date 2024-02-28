import React from 'react';
import ReactDOM from 'react-dom';
import AppGenerator from './AppGenerator';
import type { TimeOverride } from '../lib/utils/timeUtil';

import { createApolloClient } from './apolloClient';
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { populateComponentsAppDebug } from '../lib/vulcan-lib';
import { initServerSentEvents } from "./serverSentEventsClient";
import { initReCaptcha } from './reCaptcha';
import { initAutoRefresh } from './autoRefresh';
import { rememberScrollPositionOnPageReload } from './scrollRestoration';
import { addClickHandlerToCheckboxLabels } from './clickableCheckboxLabels';
import { googleTagManagerInit } from './ga';

export function browserMain() {
  console.log("Running browserMain");
  googleTagManagerInit();
  void initReCaptcha();
  initAutoRefresh();
  rememberScrollPositionOnPageReload();
  addClickHandlerToCheckboxLabels();

  populateComponentsAppDebug();
  initServerSentEvents();
  const apolloClient = createApolloClient();
  const foreignApolloClient = createApolloClient(fmCrosspostBaseUrlSetting.get() ?? "/");

  const ssrRenderedAt: Date = new Date(window.ssrRenderedAt);
  const timeOverride: TimeOverride = {currentTime: null};

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

  if (document.getElementById("preload-scaffold-page")) {
    const scaffoldReactRoot = document.getElementById('react-app');
    scaffoldReactRoot?.setAttribute("id", "scaffold-react-app");
    const newReactRoot = document.createElement("div");
    newReactRoot.setAttribute("id", "react-app");
    document.body.appendChild(newReactRoot);
    
    ReactDOM.render(
      <Main />,
      document.getElementById('react-app'),
      () => {
      }
    );
    document.getElementById('scaffold-react-app')?.remove();
  } else {
    timeOverride.currentTime = ssrRenderedAt;
    apolloClient.disableNetworkFetches = true;
    foreignApolloClient.disableNetworkFetches = true;

    ReactDOM.hydrate(
      <Main />,
      document.getElementById('react-app'),
      () => {
        apolloClient.disableNetworkFetches = false;
        foreignApolloClient.disableNetworkFetches = false;
        timeOverride.currentTime = null;
      }
    );
  }
  
  void registerServiceWorker();
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const serviceWorkerUrl = getServiceWorkerUrl();
    console.log(`Registering service worker ${serviceWorkerUrl}`);
    try {
      const registration = await navigator.serviceWorker.register(
        getServiceWorkerUrl(),
        {
          scope: './',
        }
      );
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
}

function getServiceWorkerUrl(): string {
  const scriptTags = document.getElementsByTagName("script");
  for (let i=0; i<scriptTags.length; i++) {
    const src = scriptTags[i].getAttribute("src");
    if (src && src.startsWith("/js/bundle.js")) {
      return src;
    }
  }
  return "/js/bundle.js";
}
