import React from 'react';
import { ApolloProvider } from '@apollo/client';
// eslint-disable-next-line no-restricted-imports
import { StaticRouter } from 'react-router';
import { Components } from '../../../../lib/vulcan-lib/components';
import { CookiesProvider } from 'react-cookie';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../../../../lib/abTestImpl';
import { ServerRequestStatusContextType } from '../../../../lib/vulcan-core/appContext';
import type { CompleteTestGroupAllocation } from '../../../../lib/abTestImpl';
import { getAllCookiesFromReq } from '../../../utils/httpUtil';
import type { TimeOverride } from '../../../../lib/utils/timeUtil';

// Server-side wrapper around the app. There's another AppGenerator which is
// the client-side version, which differs in how it sets up the wrappers for
// routing and cookies and such. See client/start.tsx.
const AppGenerator = ({ req, apolloClient, serverRequestStatus, abTestGroupsUsed, timeOverride }: {
  req: any
  apolloClient: any
  serverRequestStatus: ServerRequestStatusContextType,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  timeOverride: TimeOverride,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
      <StaticRouter location={req.url} context={{}}>
        <CookiesProvider cookies={getAllCookiesFromReq(req)}>
          <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
            <Components.App apolloClient={apolloClient} serverRequestStatus={serverRequestStatus} timeOverride={timeOverride}/>
          </ABTestGroupsUsedContext.Provider>
        </CookiesProvider>
      </StaticRouter>
    </ApolloProvider>
  );
  return App;
};
export default AppGenerator;
