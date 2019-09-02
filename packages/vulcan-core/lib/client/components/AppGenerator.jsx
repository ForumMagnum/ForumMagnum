/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { runCallbacks, Components, UserContextWrapper } from 'meteor/vulcan:lib';
import { CookiesProvider } from 'react-cookie';
import { BrowserRouter } from 'react-router-dom';

const AppGenerator = ({ apolloClient }) => {
  const App = (
    <ApolloProvider client={apolloClient}>
    <UserContextWrapper>
    <CookiesProvider>
    <BrowserRouter>
      <Components.App />
    </BrowserRouter>
    </CookiesProvider>
    </UserContextWrapper>
    </ApolloProvider>
  );
  // run user registered callbacks to wrap the app
  const WrappedApp = runCallbacks({
    name: 'router.client.wrapper', 
    iterator: App, 
    properties: { apolloClient }
  });
  return WrappedApp;
};
export default AppGenerator;