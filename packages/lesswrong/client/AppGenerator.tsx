// Client-side React wrapper/context provider
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Components } from '../lib/vulcan-lib';
import { wrapWithMuiTheme } from './themeProvider';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../lib/abTestImpl';

const AppGenerator = ({ apolloClient, abTestGroupsUsed }: {
  apolloClient: any,
  abTestGroupsUsed: RelevantTestGroupAllocation,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <CookiesProvider>
        <BrowserRouter>
          <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
            <Components.App apolloClient={apolloClient} />
          </ABTestGroupsUsedContext.Provider>
        </BrowserRouter>
      </CookiesProvider>
    </ApolloProvider>
  );
  return wrapWithMuiTheme(App);
};
export default AppGenerator;
