import React from 'react';
import ReactDOM from 'react-dom';
import { onPageLoad } from 'meteor/server-render';
import AppGenerator from './AppGenerator';
import { Meteor } from 'meteor/meteor';

import { createApolloClient } from '../vulcan-lib/apollo-client/apolloClient';
import { populateComponentsApp } from '../../lib/vulcan-lib';

Meteor.startup(() => {
  // init the application components and routes, including components & routes from 3rd-party packages
  populateComponentsApp();
  const apolloClient = createApolloClient();
  apolloClient.disableNetworkFetches = true;

  // Create the root element, if it doesn't already exist.
  if (!document.getElementById('react-app')) {
    const rootElement = document.createElement('div');
    rootElement.id = 'react-app';
    document.body.appendChild(rootElement);
  }

  const Main = () => (
    <AppGenerator apolloClient={apolloClient} />
  );

  onPageLoad(() => {
    ReactDOM.hydrate(
      <Main />,
      document.getElementById('react-app'),
      () => {
        console.log("Finished hydration");
        apolloClient.disableNetworkFetches = false;
      }
    );
  });
});
