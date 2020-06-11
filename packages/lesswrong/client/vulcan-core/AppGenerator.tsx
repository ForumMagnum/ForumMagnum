/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { runCallbacks, Components } from '../../lib/vulcan-lib';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';

const AppGenerator = ({ apolloClient }) => {
  const App = (
    <ApolloProvider client={apolloClient}>
        <CookiesProvider>
            <BrowserRouter>
                <Components.App />
            </BrowserRouter>
        </CookiesProvider>
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
