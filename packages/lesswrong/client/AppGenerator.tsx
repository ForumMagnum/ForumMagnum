// Client-side React wrapper/context provider
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { Components } from '../lib/vulcan-lib';
import { wrapWithMuiTheme } from './themeProvider';
import { ForeignApolloClientProvider } from '../components/hooks/useForeignApolloClient';
import { PrefersDarkModeProvider } from '../components/themes/usePrefersDarkMode';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../lib/abTestImpl';
import type { AbstractThemeOptions } from '../themes/themeNames';
import type { TimeOverride } from '../lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '../components/hooks/useLayoutOptions';

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ apolloClient, foreignApolloClient, abTestGroupsUsed, themeOptions, timeOverride }: {
  apolloClient: ApolloClient<NormalizedCacheObject>,
  foreignApolloClient: ApolloClient<NormalizedCacheObject>,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  timeOverride: TimeOverride,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        <CookiesProvider>
          <BrowserRouter>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <PrefersDarkModeProvider>
                <LayoutOptionsContextProvider>
                  <Components.App apolloClient={apolloClient} timeOverride={timeOverride}/>
                </LayoutOptionsContextProvider>
              </PrefersDarkModeProvider>
            </ABTestGroupsUsedContext.Provider>
          </BrowserRouter>
        </CookiesProvider>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
  return wrapWithMuiTheme(App, themeOptions);
};
export default AppGenerator;
