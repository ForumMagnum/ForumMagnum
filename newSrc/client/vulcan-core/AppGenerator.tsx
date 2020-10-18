/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Components } from '../../lib/vulcan-lib';
import { wrapWithMuiTheme } from '../themeProvider';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsContext } from '../../lib/abTestImpl';

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
  return wrapWithMuiTheme(App);
};
export default AppGenerator;
