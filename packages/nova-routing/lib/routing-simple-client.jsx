// githunt
import React from 'react';
import { render } from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import 'isomorphic-fetch';

// nova
import ApolloClient from 'apollo-client';
import { meteorClientConfig } from 'meteor/nova:apollo';
import { configureStore } from "./store.js";
import { Components, Actions, runCallbacks, Routes } from 'meteor/nova:core';

Meteor.startup(function initClientRouting() {
  const initialState = window.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle

  const client = new ApolloClient(meteorClientConfig({
    initialState,
    cookieLoginToken: 'cookie-pipo',
  }));

  const store = configureStore(client, initialState); 

  const onUpdate = () => {
    runCallbacks('router.onUpdate');
    store.dispatch(Actions.messages.clearSeen());
  };
  
  const rootElementName = 'root';
  const rootElementType = 'div';
  const attributes = [];
  let rootElement = document.getElementById(rootElementName);

  // In case the root element doesn't exist, let's create it
  if (!rootElement) {
    rootElement = document.createElement(rootElementType);
    rootElement.id = rootElementName;

    // check if a 2-dimensional array was passed... if not, be nice and handle it anyway
    if(attributes[0] instanceof Array) {
      // set attributes
      for(var i = 0; i < attributes.length; i++) {
        rootElement.setAttribute(attributes[i][0], attributes[i][1]);
      }
    } else if (attributes.length > 0){
      rootElement.setAttribute(attributes[0], attributes[1]);
    }

    document.body.appendChild(rootElement);
  }
  
  const indexRoute = _.filter(Routes, route => route.path === '/')[0];
  const childRoutes = _.reject(Routes, route => route.path === '/');
  
  delete indexRoute.path; // delete the '/' path to avoid warning
  
  const routes = {
    path: '/',
    component: Components.App,
    indexRoute,
    childRoutes,
  };

  render((
    <ApolloProvider client={client} store={store}>
      <Router history={browserHistory} onUpdate={onUpdate}>
        {routes}
      </Router>
    </ApolloProvider>
  ), document.getElementById('root'));
});
