/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { StaticRouter } from 'react-router';
import { UserContextWrapper } from '../../../modules/withCurrentUser.js';

import { Components } from 'meteor/vulcan:lib';

import { CookiesProvider } from 'react-cookie';

import Cookies from 'universal-cookie';
// The client-side App will instead use <BrowserRouter>
// see client-side vulcan:core/lib/client/start.jsx implementation
// we do the same server side

const AppGenerator = ({ req, apolloClient, context, serverRequestStatus }) => {
  // TODO: universalCookies should be defined here, but it isn't
  // @see https://github.com/meteor/meteor-feature-requests/issues/174#issuecomment-441047495
  const cookies = new Cookies(req.cookies); // req.universalCookies;
  
  const RoutedApp = (
    <StaticRouter location={req.url} context={{}}>
      <Components.App serverRequestStatus={serverRequestStatus}/>
    </StaticRouter>
  );

  // run user registered callbacks that wraps the React app
  const WrappedApp = runCallbacks({
    name: 'router.server.wrapper',
    iterator: RoutedApp,
    properties: { req, context, apolloClient },
  });

  const App = (
    <ApolloProvider client={apolloClient}>
    <UserContextWrapper>
    <CookiesProvider cookies={cookies}>
    {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
      {WrappedApp}
    </CookiesProvider>
    </UserContextWrapper>
    </ApolloProvider>
  );
  
  
  return App;
};
export default AppGenerator;
