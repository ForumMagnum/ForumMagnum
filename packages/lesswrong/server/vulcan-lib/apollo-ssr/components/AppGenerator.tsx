import React from 'react';
import { ApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { Request } from 'express';
// eslint-disable-next-line no-restricted-imports
import { StaticRouter } from 'react-router';
import { ForeignApolloClientProvider } from '../../../../components/hooks/useForeignApolloClient';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../../../../lib/abTestImpl';
import { ServerRequestStatusContextType } from '../../../../lib/vulcan-core/appContext';
import { getAllCookiesFromReq } from '../../../utils/httpUtil';
import { SSRMetadata, EnvironmentOverrideContext } from '../../../../lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '../../../../components/hooks/useLayoutOptions';
import { ThemeContextProvider } from '@/components/themes/useTheme';
import { AbstractThemeOptions } from '@/themes/themeNames';
import AppComponent from '../../../../components/vulcan-core/App';

// Server-side wrapper around the app. There's another AppGenerator which is
// the client-side version, which differs in how it sets up the wrappers for
// routing and cookies and such. See client/start.tsx.
const AppGenerator = ({ req, apolloClient, foreignApolloClient, serverRequestStatus, abTestGroupsUsed, ssrMetadata, themeOptions }: {
  req: Request,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  foreignApolloClient: ApolloClient<NormalizedCacheObject>,
  serverRequestStatus: ServerRequestStatusContextType,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  ssrMetadata: SSRMetadata,
  themeOptions: AbstractThemeOptions,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
        <StaticRouter location={req.url}>
          <CookiesProvider cookies={getAllCookiesFromReq(req)}>
            <ThemeContextProvider options={themeOptions}>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <LayoutOptionsContextProvider>
                <EnvironmentOverrideContext.Provider value={{
                  ...ssrMetadata,
                  matchSSR: true
                }}>
                  <AppComponent
                    apolloClient={apolloClient}
                    serverRequestStatus={serverRequestStatus}
                  />
                </EnvironmentOverrideContext.Provider>
              </LayoutOptionsContextProvider>
            </ABTestGroupsUsedContext.Provider>
            </ThemeContextProvider>
          </CookiesProvider>
        </StaticRouter>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
  return App;
};
export default AppGenerator;
