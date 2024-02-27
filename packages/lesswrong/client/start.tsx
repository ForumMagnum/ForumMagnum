import React from 'react';
import ReactDOM from 'react-dom';
import AppGenerator from './AppGenerator';
import { onStartup } from '../lib/executionEnvironment';
import type { TimeOverride } from '../lib/utils/timeUtil';

import { createApolloClient } from './apolloClient';
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { populateComponentsAppDebug } from '../lib/vulcan-lib';
import { initServerSentEvents } from "./serverSentEventsClient";

function browserMain() {
  console.log("Running browserMain");
  populateComponentsAppDebug();
  initServerSentEvents();
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

  let usedScaffoldPage = false;
  if (document.getElementById("preload-scaffold-page")) {
    usedScaffoldPage = true;
    const scaffoldReactRoot = document.getElementById('react-app');
    scaffoldReactRoot?.setAttribute("id", "scaffold-react-app");
    const newReactRoot = document.createElement("div");
    newReactRoot.setAttribute("id", "react-app");
    document.body.appendChild(newReactRoot);
  }

  ReactDOM.hydrate(
    <Main />,
    document.getElementById('react-app'),
    () => {
      apolloClient.disableNetworkFetches = false;
      foreignApolloClient.disableNetworkFetches = false;
      timeOverride.currentTime = null;
    }
  );
  
  if (usedScaffoldPage) {
    document.getElementById('scaffold-react-app')?.remove();
  }
  
  void registerServiceWorker();
}

async function registerServiceWorker() {
  console.log("Registering service worker");
  if ('serviceWorker' in navigator) {
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
  return "/js/serviceWorker.js"; // TODO: plumbing for a hash
}

// Order 100 to make this execute last
onStartup(() => {
  browserMain();
}, 100);
