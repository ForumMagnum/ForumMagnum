/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from '@apollo/client';
// eslint-disable-next-line no-restricted-imports
import { StaticRouter } from 'react-router';
import { Components } from '../../../../lib/vulcan-lib/components';
import { CookiesProvider } from 'react-cookie';
import Cookies from 'universal-cookie';
import { ABTestGroupsContext } from '../../../../lib/abTestImpl';
import { ServerRequestStatusContextType } from '../../../../lib/vulcan-core/appContext';
import type { CompleteTestGroupAllocation } from '../../../../lib/abTestImpl';

// The client-side App will instead use <BrowserRouter>
// see client-side vulcan:core/lib/client/start.jsx implementation
// we do the same server side

const AppGenerator = ({ req, apolloClient, serverRequestStatus, abTestGroups }: {
  req: any
  apolloClient: any
  serverRequestStatus: ServerRequestStatusContextType,
  abTestGroups: CompleteTestGroupAllocation,
}) => {
  // TODO: universalCookies should be defined here, but it isn't
  // @see https://github.com/meteor/meteor-feature-requests/issues/174#issuecomment-441047495
  const cookies = new Cookies(req.cookies); // req.universalCookies;
  const App = (
    <ApolloProvider client={apolloClient}>
      {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
      <StaticRouter location={req.url} context={{}}>
        <CookiesProvider cookies={cookies}>
          <ABTestGroupsContext.Provider value={abTestGroups}>
            <Components.App apolloClient={apolloClient} serverRequestStatus={serverRequestStatus}/>
          </ABTestGroupsContext.Provider>
        </CookiesProvider>
      </StaticRouter>
    </ApolloProvider>
  );
  return App;
};
export default AppGenerator;
