/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Components } from '../../lib/vulcan-lib';
import { wrapWithMuiTheme } from '../themeProvider';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsContext } from '../../lib/abTestImpl';

const AppGenerator = ({ apolloClient, abTestGroups, themeName }) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <CookiesProvider>
        <BrowserRouter>
          <ABTestGroupsContext.Provider value={abTestGroups}>
            <Components.App apolloClient={apolloClient} />
          </ABTestGroupsContext.Provider>
        </BrowserRouter>
      </CookiesProvider>
    </ApolloProvider>
  );
  return wrapWithMuiTheme(App, themeName);
};
export default AppGenerator;
