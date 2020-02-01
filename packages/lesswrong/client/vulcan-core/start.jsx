import React from 'react';
import ReactDOM from 'react-dom';
import { onPageLoad } from 'meteor/server-render';
import AppGenerator from './AppGenerator';

import { createApolloClient, populateComponentsApp, runCallbacks } from 'meteor/vulcan:lib';

Meteor.startup(() => {
  // init the application components and routes, including components & routes from 3rd-party packages
  populateComponentsApp();
  const apolloClient = createApolloClient();

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
    ReactDOM.hydrate(<Main />, document.getElementById('react-app'));
    runCallbacks({ name: 'client.hydrate.after', iterator: null});
  });
});
