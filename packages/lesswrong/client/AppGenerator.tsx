// Client-side React wrapper/context provider
import React, { useEffect, useMemo, useState, useTransition } from 'react';
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
import type { SSRMetadata, EnvironmentOverride } from '../lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '../components/hooks/useLayoutOptions';

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ apolloClient, foreignApolloClient, abTestGroupsUsed, themeOptions, ssrMetadata }: {
  apolloClient: ApolloClient<NormalizedCacheObject>,
  foreignApolloClient: ApolloClient<NormalizedCacheObject>,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
}) => {
  const [envOverride, setEnvOverride] = useState<EnvironmentOverride>(ssrMetadata ? {
    ...ssrMetadata,
    matchSSR: true
  } : { matchSSR: false });
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    if (envOverride.matchSSR === false) return;

    startTransition(() => {
      setEnvOverride({matchSSR: false});
    });

  }, [envOverride.matchSSR]);

  const App = useMemo(() => {
    const app = (
      <ApolloProvider client={apolloClient}>
        <ForeignApolloClientProvider value={foreignApolloClient}>
          <CookiesProvider>
            <BrowserRouter>
              <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
                <PrefersDarkModeProvider>
                  <LayoutOptionsContextProvider>
                    <Components.App apolloClient={apolloClient} envOverride={envOverride} />
                  </LayoutOptionsContextProvider>
                </PrefersDarkModeProvider>
              </ABTestGroupsUsedContext.Provider>
            </BrowserRouter>
          </CookiesProvider>
        </ForeignApolloClientProvider>
      </ApolloProvider>
    );
    return wrapWithMuiTheme(app, themeOptions);
  }, [abTestGroupsUsed, apolloClient, envOverride, foreignApolloClient, themeOptions]);
  return App;
};
export default AppGenerator;
