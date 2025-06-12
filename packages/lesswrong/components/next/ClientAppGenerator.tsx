"use client";

// Client-side React wrapper/context provider
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ApolloLink, ApolloProvider, InMemoryCache } from '@apollo/client';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ForeignApolloClientProvider } from '@/components/hooks/useForeignApolloClient';
import { PrefersDarkModeProvider } from '@/components/themes/usePrefersDarkMode';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '@/lib/abTestImpl';
import type { AbstractThemeOptions } from '@/themes/themeNames';
import { LayoutOptionsContextProvider } from '@/components/hooks/useLayoutOptions';
import { SSRMetadata, EnvironmentOverride, EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/useTheme';
import { createErrorLink, createHttpLink, headerLink } from '@/lib/apollo/links';
import { siteImageSetting } from '@/lib/publicSettings';
import { LocationContext, NavigationContext, SubscribeLocationContext, ServerRequestStatusContext, checkUserRouteAccess, parseRoute } from '@/lib/vulcan-core/appContext';
import { MessageContextProvider } from '../common/FlashMessages';
import HeadTags from '../common/HeadTags';
import { RefetchCurrentUserContext } from '../common/withUser';
import ScrollToTop from '../vulcan-core/ScrollToTop';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import type { History } from 'history'
import { useQueryCurrentUser } from '@/lib/crud/withCurrentUser';
import { useParams, usePathname } from 'next/navigation';
import Layout from '../Layout';
import { useHistory } from 'react-router';

const AppComponent = ({children}: {children: React.ReactNode}) => {
  const pathname = usePathname();
  const params: Record<string, string> = useParams();
  // TODO: implement the location and subscribed location values properly
  const locationContext = useRef<RouterLocation | null>({ params, pathname, query: {}, hash: '', redirected: false, currentRoute: null, RouteComponent: null, location: { pathname, search: '', hash: '' }, url: '' });
  const subscribeLocationContext = useRef<RouterLocation | null>({ params, pathname, query: {}, hash: '', redirected: false, currentRoute: null, RouteComponent: null, location: { pathname, search: '', hash: '' }, url: '' });

  const history = useHistory();
  const navigationContext = useRef<{ history: History<unknown> } | null>({ history });

  const {currentUser, refetchCurrentUser, currentUserLoading} = useQueryCurrentUser();

  // TODO: implement the below logic taken from App.tsx if needed?
  // const location = checkUserRouteAccess(currentUser, parseRoute({location: reactDomLocation}));
  
  // if (location.redirected) {
  //   return (
  //     <PermanentRedirect url={location.url} />
  //   );
  // }

  //   // Reuse the container objects for location and navigation context, so that
  // // they will be reference-stable and won't trigger spurious rerenders.
  // if (!locationContext.current) {
  //   locationContext.current = {...location};
  // } else {
  //   Object.assign(locationContext.current, location);
  // }
  
  // if (!navigationContext.current) {
  //   navigationContext.current = { history };
  // } else {
  //   navigationContext.current.history = history;
  // }

  // // subscribeLocationContext changes (by shallow comparison) whenever the
  // // URL changes.
  // // FIXME: Also needs to include changes to hash and to query params
  // if (!subscribeLocationContext.current ||
  //   subscribeLocationContext.current.pathname !== location.pathname ||
  //   JSON.stringify(subscribeLocationContext.current.query) !== JSON.stringify(location.query) ||
  //   subscribeLocationContext.current.hash !== location.hash
  // ) {
  //   subscribeLocationContext.current = {...location};
  // } else {
  //   Object.assign(subscribeLocationContext.current, location);
  // }


  return <LocationContext.Provider value={locationContext.current}>
  <NavigationContext.Provider value={navigationContext.current}>
  <SubscribeLocationContext.Provider value={subscribeLocationContext.current}>
  <ServerRequestStatusContext.Provider value={/*serverRequestStatus||*/null}>
  <RefetchCurrentUserContext.Provider value={refetchCurrentUser}>
    <MessageContextProvider>
      <HeadTags image={siteImageSetting.get()} />
      <ScrollToTop />
      <Layout currentUser={currentUser}>
        {children}
      </Layout>
    </MessageContextProvider>
  </RefetchCurrentUserContext.Provider>
  </ServerRequestStatusContext.Provider>
  </SubscribeLocationContext.Provider>
  </NavigationContext.Provider>
  </LocationContext.Provider>;
}

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ abTestGroupsUsed, themeOptions, ssrMetadata, children }: {
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
  children: React.ReactNode,
}) => {
  const cache = new InMemoryCache();
  const apolloClient = new ApolloClient({
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink("/")]),
    cache,
    ssrForceFetchDelay: 1,
  });
  // TODO: This is a hack to get the foreign apollo client to work.
  const foreignApolloClient = apolloClient;
  
  return (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        <CookiesProvider>
          <ThemeContextProvider options={themeOptions}>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <PrefersDarkModeProvider>
                <LayoutOptionsContextProvider>
                  <EnvironmentOverrideContextProvider ssrMetadata={ssrMetadata}>
                    <AppComponent>
                      {children}
                    </AppComponent>
                  </EnvironmentOverrideContextProvider>
                </LayoutOptionsContextProvider>
              </PrefersDarkModeProvider>
            </ABTestGroupsUsedContext.Provider>
          </ThemeContextProvider>
        </CookiesProvider>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
};

const EnvironmentOverrideContextProvider = ({ssrMetadata, children}: {
  ssrMetadata?: SSRMetadata
  children: React.ReactNode
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

  return <EnvironmentOverrideContext.Provider value={envOverride}>
    {children}
  </EnvironmentOverrideContext.Provider>
}

export default AppGenerator;