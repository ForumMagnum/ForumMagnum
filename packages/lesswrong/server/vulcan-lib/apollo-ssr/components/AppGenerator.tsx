import React from 'react';
import { ApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { Request } from 'express';
// eslint-disable-next-line no-restricted-imports
import { StaticRouter } from 'react-router';
import { Components } from '../../../../lib/vulcan-lib/components';
import { ForeignApolloClientProvider } from '../../../../components/hooks/useForeignApolloClient';
import { CookiesProvider } from 'react-cookie';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../../../../lib/abTestImpl';
import { ServerRequestStatusContextType } from '../../../../lib/vulcan-core/appContext';
import { getAllCookiesFromReq } from '../../../utils/httpUtil';
import type { TimeOverride } from '../../../../lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '../../../../components/hooks/useLayoutOptions';

// Server-side wrapper around the app. There's another AppGenerator which is
// the client-side version, which differs in how it sets up the wrappers for
// routing and cookies and such. See client/start.tsx.
const AppGenerator = ({ req, apolloClient, foreignApolloClient, serverRequestStatus, abTestGroupsUsed, timeOverride }: {
  req: Request,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  foreignApolloClient: ApolloClient<NormalizedCacheObject>,
  serverRequestStatus: ServerRequestStatusContextType,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  timeOverride: TimeOverride,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
        <StaticRouter location={req.url} context={{}}>
          <CookiesProvider cookies={getAllCookiesFromReq(req)}>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <LayoutOptionsContextProvider>
                <Components.App
                  apolloClient={apolloClient}
                  serverRequestStatus={serverRequestStatus}
                  timeOverride={timeOverride}
                />
              </LayoutOptionsContextProvider>
            </ABTestGroupsUsedContext.Provider>
          </CookiesProvider>
        </StaticRouter>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
  return App;
};
export default AppGenerator;
