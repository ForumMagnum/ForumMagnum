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
import type { TimeOverride } from '../lib/utils/timeUtil';

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ apolloClient, abTestGroupsUsed, themeOptions, timeOverride }: {
  apolloClient: any,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: ThemeOptions,
  timeOverride: TimeOverride,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <CookiesProvider>
        <BrowserRouter>
          <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
            <Components.App apolloClient={apolloClient} timeOverride={timeOverride}/>
          </ABTestGroupsUsedContext.Provider>
        </BrowserRouter>
      </CookiesProvider>
    </ApolloProvider>
  );
  return wrapWithMuiTheme(App, themeOptions);
};
export default AppGenerator;
