import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { DatabasePublicSetting, localeSetting } from '../../lib/publicSettings';
import { IntlProvider } from '../../lib/vulcan-i18n';
import { Components, registerComponent, Strings, userChangedCallback } from '../../lib/vulcan-lib';
import { MessageContext } from '../common/withMessages';
import { TimeOverride, TimeContext } from '../../lib/utils/timeUtil';
// eslint-disable-next-line no-restricted-imports
import { useLocation } from 'react-router';
import { useQueryCurrentUser } from '../../lib/crud/withCurrentUser';
import {
  LocationContext,
  parseRoute,
  ServerRequestStatusContext,
  SubscribeLocationContext,
  ServerRequestStatusContextType,
} from '../../lib/vulcan-core/appContext';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';

export const siteImageSetting = new DatabasePublicSetting<string>('siteImage', 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1654295382/new_mississippi_river_fjdmww.jpg') // An image used to represent the site on social media

type Message = AnyBecauseTodo;

const App = ({serverRequestStatus, timeOverride}: {
  apolloClient: AnyBecauseTodo,
  serverRequestStatus?: ServerRequestStatusContextType,
  timeOverride: TimeOverride,
}) => {
  const {currentUser, currentUserLoading} = useQueryCurrentUser();
  const reactDomLocation = useLocation();
  const locationContext = useRef<RouterLocation | null>(null);
  const subscribeLocationContext = useRef<RouterLocation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const locale = localeSetting.get();

  const flash = useCallback((message: Message) => {
    setMessages((messages) => [...messages, message]);
  }, []);

  const clear = useCallback(() => {
    // When clearing messages, we first set all current messages to have a hide
    // property and only after 500ms set the array to empty, to allow UI
    // elements to show a fade-out animation
    setMessages((messages) => messages.map((message) => ({
      ...message,
      hide: true,
    })));
    setTimeout(() => setMessages([]), 500);
  }, []);

  useEffect(() => {
    void userChangedCallback.runCallbacks({
      iterator: currentUser,
      properties: [],
    });
    moment.locale(locale);
  }, [currentUser, locale]);

  useEffect(() => {
    void userChangedCallback.runCallbacks({
      iterator: currentUser,
      properties: [],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  // Parse the location into a route/params/query/etc.
  const location = parseRoute({location: reactDomLocation});
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

  // subscribeLocationContext changes (by shallow comparison) whenever the
  // URL changes.
  // FIXME: Also needs to include changes to hash and to query params
  if (!subscribeLocationContext.current ||
    subscribeLocationContext.current.pathname !== location.pathname ||
    JSON.stringify(subscribeLocationContext.current.query) !== JSON.stringify(location.query) ||
    subscribeLocationContext.current.hash != location.hash
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
    <SubscribeLocationContext.Provider value={subscribeLocationContext.current}>
    <ServerRequestStatusContext.Provider value={serverRequestStatus||null}>
    <TimeContext.Provider value={timeOverride}>
    <IntlProvider locale={locale} key={locale} messages={Strings[locale]}>
      <MessageContext.Provider value={{messages, flash, clear}}>
        <Components.HeadTags image={siteImageSetting.get()} />
        <Components.ScrollToTop />
        <Components.Layout currentUser={currentUser}>
          <location.RouteComponent />
        </Components.Layout>
      </MessageContext.Provider>
    </IntlProvider>
    </TimeContext.Provider>
    </ServerRequestStatusContext.Provider>
    </SubscribeLocationContext.Provider>
    </LocationContext.Provider>
  );
}

const AppComponent = registerComponent('App', App);

declare global {
  interface ComponentTypes {
    App: typeof AppComponent
  }
}

export default App;
