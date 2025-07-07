"use client";

// Import needed to get the database settings from the window on the client
import '@/client/publicSettings';


import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { PrefersDarkModeProvider } from '@/components/themes/usePrefersDarkMode';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '@/lib/abTestImpl';
import type { AbstractThemeOptions } from '@/themes/themeNames';
import { LayoutOptionsContextProvider } from '@/components/hooks/useLayoutOptions';
import { SSRMetadata, EnvironmentOverride, EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
import { LocationContext, NavigationContext, SubscribeLocationContext, ServerRequestStatusContext, parseRoute, parsePath } from '@/lib/vulcan-core/appContext';
import { MessageContextProvider } from '../common/FlashMessages';
import { RefetchCurrentUserContext } from '../common/withUser';
import ScrollToTop from '../vulcan-core/ScrollToTop';
import { useQueryCurrentUser } from '@/lib/crud/withCurrentUser';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Layout from '../Layout';
import { HelmetProvider } from 'react-helmet-async';
import { EnableSuspenseContext } from '@/lib/crud/useQuery';
import { isServer } from '@/lib/executionEnvironment';
import Cookies from 'universal-cookie';
import { ApolloWrapper } from '@/components/common/ApolloWrapper';

import '@/lib/utils/extendSimpleSchemaOptions';
import '@/lib/routes';

import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const AppComponent = ({ children }: { children: React.ReactNode }) => {
  const locationContext = useRef<RouterLocation | null>(null);
  const subscribeLocationContext = useRef<RouterLocation | null>(null);
  const history = useRouter();
  const navigationContext = useRef<{ history: AppRouterInstance } | null>({ history });

  const searchParams = Object.fromEntries(useSearchParams().entries());
  const pathname = usePathname();
  // TODO: implement the location and subscribed location values in ways that don't depend on our old route definitions
  const reconstructedPath = `${pathname}${searchParams && Object.keys(searchParams).length > 0 ? `?${Object.entries(searchParams).map(([key, value]) => `${key}=${value}`).join('&')}` : ''}`;
  const parsedPath = parsePath(reconstructedPath);
  const location = parseRoute({ location: parsedPath, onError: undefined });

  const {currentUser, refetchCurrentUser, currentUserLoading} = useQueryCurrentUser();

  // TODO: implement the below logic taken from App.tsx if needed?
  // const location = checkUserRouteAccess(currentUser, parseRoute({location: reactDomLocation}));
  
  // if (location.redirected) {
  //   return (
  //     <PermanentRedirect url={location.url} />
  //   );
  // }

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


  return <HelmetProvider>
  <LocationContext.Provider value={locationContext.current}>
  <NavigationContext.Provider value={navigationContext.current}>
  <SubscribeLocationContext.Provider value={subscribeLocationContext.current}>
  <ServerRequestStatusContext.Provider value={/*serverRequestStatus||*/null}>
  <RefetchCurrentUserContext.Provider value={refetchCurrentUser}>
    <MessageContextProvider>
      {/* <HeadTags image={siteImageSetting.get()} /> */}
      <ScrollToTop />
      <Layout currentUser={currentUser}>
        {children}
      </Layout>
    </MessageContextProvider>
  </RefetchCurrentUserContext.Provider>
  </ServerRequestStatusContext.Provider>
  </SubscribeLocationContext.Provider>
  </NavigationContext.Provider>
  </LocationContext.Provider>
  </HelmetProvider>;
}

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ abTestGroupsUsed, themeOptions, ssrMetadata, user, cookies, headers, searchParams, children }: {
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
  user: DbUser | null,
  cookies: RequestCookie[],
  headers: Record<string, string>,
  searchParams: Record<string, string>,
  children: React.ReactNode,
}) => {
  const universalCookies = new Cookies(Object.fromEntries(cookies.map((cookie) => [cookie.name, cookie.value])));
  const loginToken = universalCookies.get('loginToken');

  return (
    // <ApolloProvider client={apolloClient}>
      // <ForeignApolloClientProvider value={foreignApolloClient}>
        <EnableSuspenseContext.Provider value={isServer}>
        <ApolloWrapper
          loginToken={loginToken}
          user={user}
          cookies={cookies}
          headers={headers}
          searchParams={searchParams}
        >
        <CookiesProvider cookies={universalCookies}>
          <ThemeContextProvider options={themeOptions} isEmail={false}>
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
        </ApolloWrapper>
        </EnableSuspenseContext.Provider>
    //   </ForeignApolloClientProvider>
    // </ApolloProvider>
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