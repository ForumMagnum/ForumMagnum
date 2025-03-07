import React, { useEffect, useRef } from 'react';
import moment from 'moment';
import { DatabasePublicSetting, localeSetting, siteImageSetting } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
// eslint-disable-next-line no-restricted-imports
import { useLocation, withRouter } from 'react-router';
import { useQueryCurrentUser } from '../../lib/crud/withCurrentUser';
import {
  LocationContext,
  parseRoute,
  ServerRequestStatusContext,
  SubscribeLocationContext,
  ServerRequestStatusContextType,
  NavigationContext,
  checkUserRouteAccess,
} from '../../lib/vulcan-core/appContext'
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { MessageContextProvider } from '../common/FlashMessages';
import type { History } from 'history'
import { RefetchCurrentUserContext } from '../common/withUser';
import { onUserChanged } from '@/client/logging';

interface ExternalProps {
  apolloClient: AnyBecauseTodo,
  serverRequestStatus?: ServerRequestStatusContextType,
}

const App = ({serverRequestStatus, history}: ExternalProps & {
  history: History
}) => {
  const {currentUser, refetchCurrentUser, currentUserLoading} = useQueryCurrentUser();
  const reactDomLocation = useLocation();
  const locationContext = useRef<RouterLocation | null>(null);
  const subscribeLocationContext = useRef<RouterLocation | null>(null);
  const navigationContext = useRef<{ history: History<unknown> } | null>();

  const locale = localeSetting.get();

  useEffect(() => {
    if (!bundleIsServer) {
      onUserChanged(currentUser);
    }
    moment.locale(locale);
  }, [currentUser, locale]);

  useEffect(() => {
    if (!bundleIsServer) {
      onUserChanged(currentUser);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  // Parse the location into a route/params/query/etc.
  const location = checkUserRouteAccess(currentUser, parseRoute({location: reactDomLocation}));
  
  if (location.redirected) {
    return (
      <Components.PermanentRedirect url={location.url} />
    );
  }

  // Reuse the container objects for location and navigation context, so that
  // they will be reference-stable and won't trigger spurious rerenders.
  if (!locationContext.current) {
    locationContext.current = {...location};
  } else {
    Object.assign(locationContext.current, location);
  }
  
  if (!navigationContext.current) {
    navigationContext.current = { history };
  } else {
    navigationContext.current.history = history;
  }

  // subscribeLocationContext changes (by shallow comparison) whenever the
  // URL changes.
  // FIXME: Also needs to include changes to hash and to query params
  if (!subscribeLocationContext.current ||
    subscribeLocationContext.current.pathname !== location.pathname ||
    JSON.stringify(subscribeLocationContext.current.query) !== JSON.stringify(location.query) ||
    subscribeLocationContext.current.hash !== location.hash
  ) {
    subscribeLocationContext.current = {...location};
  } else {
    Object.assign(subscribeLocationContext.current, location);
  }

  // If logged in but waiting for currentUser to load, don't render stuff.
  // (Otherwise the logged-in SSR winds up doing the queries for, and sending
  // an Apollo cache containing the results of, the union of both logged-in
  // and logged-out views.)
  if (currentUserLoading && !currentUser) {
    return (
      <Components.Loading />
    );
  }

  return (
    <LocationContext.Provider value={locationContext.current}>
    <NavigationContext.Provider value={navigationContext.current}>
    <SubscribeLocationContext.Provider value={subscribeLocationContext.current}>
    <ServerRequestStatusContext.Provider value={serverRequestStatus||null}>
    <RefetchCurrentUserContext.Provider value={refetchCurrentUser}>
      <MessageContextProvider>
        <Components.HeadTags image={siteImageSetting.get()} />
        <Components.ScrollToTop />
        <Components.Layout currentUser={currentUser}>
          <location.RouteComponent />
        </Components.Layout>
      </MessageContextProvider>
    </RefetchCurrentUserContext.Provider>
    </ServerRequestStatusContext.Provider>
    </SubscribeLocationContext.Provider>
    </NavigationContext.Provider>
    </LocationContext.Provider>
  );
}

const AppComponent = registerComponent<ExternalProps>('App', App, {
  hocs: [withRouter],
});

declare global {
  interface ComponentTypes {
    App: typeof AppComponent
  }
}

export default App;
