// Client-side React wrapper/context provider
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Components } from '../lib/vulcan-lib';
import { wrapWithMuiTheme } from './themeProvider';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../lib/abTestImpl';
import type { ThemeOptions } from '../themes/themeNames';

const AppGenerator = ({ apolloClient, abTestGroupsUsed, themeOptions }: {
  apolloClient: any,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: ThemeOptions,
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
  return wrapWithMuiTheme(App, themeOptions);
};
export default AppGenerator;
