/**
 * The App + relevant wrappers
 */
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

// The client-side App will instead use <BrowserRouter>
// see client-side vulcan:core/lib/client/start.jsx implementation
// we do the same server side

const AppGenerator = ({ req, apolloClient, serverRequestStatus, abTestGroupsUsed }: {
  req: any
  apolloClient: any
  serverRequestStatus: ServerRequestStatusContextType,
  abTestGroupsUsed: RelevantTestGroupAllocation,
}) => {
  const App = (
    <ApolloProvider client={apolloClient}>
      {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
      <StaticRouter location={req.url} context={{}}>
        <CookiesProvider cookies={getAllCookiesFromReq(req)}>
          <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
            <Components.App apolloClient={apolloClient} serverRequestStatus={serverRequestStatus}/>
          </ABTestGroupsUsedContext.Provider>
        </CookiesProvider>
      </StaticRouter>
    </ApolloProvider>
  );
  return App;
};
export default AppGenerator;
