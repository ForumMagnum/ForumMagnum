/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { runCallbacks, Components } from '../../lib/vulcan-lib';
import { ABTestGroupsContext } from '../../lib/abTestUtil';
import { CookiesProvider } from 'react-cookie';
import { BrowserRouter } from 'react-router-dom';

const AppGenerator = ({ apolloClient, abTestGroups }) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <CookiesProvider>
        <BrowserRouter>
          <ABTestGroupsContext.Provider value={abTestGroups}>
            <Components.App />
          </ABTestGroupsContext.Provider>
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
