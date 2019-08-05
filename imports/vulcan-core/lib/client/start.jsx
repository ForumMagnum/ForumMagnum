import React from 'react';
import ReactDOM from 'react-dom';
import { onPageLoad } from 'meteor/server-render';
import AppGenerator from './components/AppGenerator';

import {
  createApolloClient,
  populateComponentsApp,
  populateRoutesApp,
  initializeFragments,
  runCallbacks
} from 'vulcan:lib';

console.log("start.jsx")
Meteor.startup(() => {
  console.log("Meteor.startup")
  // init the application components and routes, including components & routes from 3rd-party packages
  initializeFragments();
  populateComponentsApp();
  populateRoutesApp();
  const apolloClient = createApolloClient();

  // Create the root element
  const rootElement = document.createElement('div');
  rootElement.id = 'react-app';
  document.body.appendChild(rootElement);

  const Main = () => (
    <AppGenerator apolloClient={apolloClient} />
  );

  onPageLoad(() => {
    ReactDOM.hydrate(<Main />, document.getElementById('react-app'));
    runCallbacks({ name: 'client.hydrate.after', iterator: null});
  });
});
