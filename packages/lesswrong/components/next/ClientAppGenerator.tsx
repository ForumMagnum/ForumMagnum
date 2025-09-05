"use client";

// Import needed to get the database settings from the window on the client
import '@/client/publicSettings';

import React, { use, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '@/lib/abTestImpl';
import type { AbstractThemeOptions } from '@/themes/themeNames';
import { LayoutOptionsContextProvider } from '@/components/hooks/useLayoutOptions';
import { SSRMetadata, EnvironmentOverride, EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
import { LocationContext, NavigationContext, SubscribeLocationContext } from '@/lib/vulcan-core/appContext';
import { parsePath } from '@/lib/vulcan-lib/routes';
import { MessageContextProvider } from '../common/FlashMessages';
import { RefetchCurrentUserContext } from '../common/withUser';
import ScrollToTop from '../vulcan-core/ScrollToTop';
import { useQueryCurrentUser } from '@/lib/crud/withCurrentUser';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import Layout from '../Layout';
import { HelmetProvider } from 'react-helmet-async';
import { EnableSuspenseContext } from '@/lib/crud/useQuery';
import { isClient, isServer } from '@/lib/executionEnvironment';
import Cookies from 'universal-cookie';
import { ApolloWrapper } from '@/components/common/ApolloWrapper';

import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { onUserChanged } from '@/client/logging';
import moment from 'moment';
import { localeSetting } from '@/lib/instanceSettings';
import { initClientOnce } from '@/client/initClient';

if (isClient) {
  // This has a downstream call to `googleTagManagerIdSetting.get()`.
  // Normally top-level calls to settings are prohibited because settings
  // are scoped to a request depending on the host (i.e. lesswrong.com vs
  // alignmentforum.org), but on the client we're getting them from the
  // settings injected into the window by the root layout so it's fine.
  // eslint-disable-next-line local/no-top-level-indirect-calls-to
  initClientOnce();
}

const AppComponent = ({ children }: { children: React.ReactNode }) => {
  const locationContext = useRef<RouterLocation | null>(null);
  const subscribeLocationContext = useRef<RouterLocation | null>(null);
  const history = useRouter();
  const navigationContext = useRef<{ history: AppRouterInstance } | null>({ history });

  const urlSearchParams = useSearchParams();
  const searchParamsString = urlSearchParams.toString();
  const searchParams = Object.fromEntries(urlSearchParams.entries());
  const pathname = usePathname();
  const hash = isClient ? window.location.hash : '';

  useEffect(() => {
    const eventListener = (e: HashChangeEvent) => {
      const newHash = new URL(e.newURL).hash;

      if (locationContext.current) {
        Object.assign(locationContext.current, { hash: newHash });
      }

      if (subscribeLocationContext.current) {
        // Reassign the reference to force subscribed consumers to rerender if it changes
        subscribeLocationContext.current = { ...subscribeLocationContext.current, hash: newHash };
      }
    };

    window.addEventListener('hashchange', eventListener);
    
    return () => {
      window.removeEventListener('hashchange', eventListener);
    };
  }, []);

  const reconstructedPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}${hash ? hash : ''}`;
  const parsedPath = parsePath(reconstructedPath);
  
  const routeParams = useParams();

  const location: RouterLocation = {
    hash,
    params: routeParams as Record<string,string>,
    pathname,
    query: searchParams,
    url: reconstructedPath,
    location: parsedPath,
  };

  const {currentUser, refetchCurrentUser, currentUserLoading} = useQueryCurrentUser();

  const locale = localeSetting.get();

  useEffect(() => {
    onUserChanged(currentUser);
    moment.locale(locale);
  }, [currentUser, locale]);

  useEffect(() => {
    onUserChanged(currentUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

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
  <RefetchCurrentUserContext.Provider value={refetchCurrentUser}>
    <MessageContextProvider>
      {/* <HeadTags image={siteImageSetting.get()} /> */}
      <ScrollToTop />
      <Layout currentUser={currentUser}>
        {children}
      </Layout>
    </MessageContextProvider>
  </RefetchCurrentUserContext.Provider>
  </SubscribeLocationContext.Provider>
  </NavigationContext.Provider>
  </LocationContext.Provider>
  </HelmetProvider>;
}

const AppGenerator = ({ abTestGroupsUsed, themeOptions, ssrMetadata, user, headers, children }: {
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
  user: DbUser | null,
  headers: Record<string, string>,
  children: React.ReactNode,
}) => {
  let universalCookies;
  let parsedCookies: RequestCookie[];
  if (isServer) {
    const { cookies } = use(import('next/headers'));
    const serverCookies = use(cookies());
    parsedCookies = serverCookies.getAll();
    universalCookies = new Cookies(Object.fromEntries(parsedCookies.map((cookie) => [cookie.name, cookie.value])));
  } else {
    const browserCookies = document.cookie;
    parsedCookies = browserCookies.split(';').map((cookie) => {
      const [name, value] = cookie.split('=');
      return { name, value };
    });
    universalCookies = new Cookies(browserCookies);
  }

  const urlSearchParams = useSearchParams();
  const loginToken = universalCookies.get('loginToken');

  return (
    // <ApolloProvider client={apolloClient}>
      // <ForeignApolloClientProvider value={foreignApolloClient}>
        <EnableSuspenseContext.Provider value={isServer}>
        <ApolloWrapper
          loginToken={loginToken}
          user={user}
          cookies={parsedCookies}
          headers={headers}
          searchParams={Object.fromEntries(urlSearchParams.entries())}
        >
        <CookiesProvider cookies={universalCookies}>
          <ThemeContextProvider options={themeOptions} isEmail={false}>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <LayoutOptionsContextProvider>
                <EnvironmentOverrideContextProvider ssrMetadata={ssrMetadata}>
                  <AppComponent>
                    {children}
                  </AppComponent>
                </EnvironmentOverrideContextProvider>
              </LayoutOptionsContextProvider>
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
