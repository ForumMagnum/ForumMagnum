"use client";

// Import needed to get the database settings from the window on the client
import '@/client/publicSettings';

import React, { use, useEffect, useRef, useState, useTransition } from 'react';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '@/components/common/sharedContexts';
import { SSRMetadata, EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
import { LocationContext, NavigationContext, SubscribeLocationContext } from '@/lib/vulcan-core/appContext';
import { parsePath } from '@/lib/vulcan-lib/routes';
import { MessageContextProvider } from '@/components/layout/FlashMessages';
import { UserContextProvider } from '../common/withUser';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { HelmetProvider } from 'react-helmet-async';
import { EnableSuspenseContext } from '@/lib/crud/useQuery';
import { isClient, isServer } from '@/lib/executionEnvironment';
import Cookies from 'universal-cookie';
import { ApolloWrapper } from '@/components/common/ApolloWrapper';

import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
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

const LocationContextProvider = ({ children }: { children: React.ReactNode }) => {
  const locationContext = useRef<RouterLocation | null>(null);
  const subscribeLocationContext = useRef<RouterLocation | null>(null);
  const history = useRouter();
  const navigationContext = useRef<{ history: AppRouterInstance } | null>({ history });

  const urlSearchParams = useSearchParams();
  const searchParamsString = urlSearchParams.toString();

  // Reduce urlSearchParams in a way that preserves multiple values under the same key
  const searchParams: Record<string, string | string[]> = {};

  [...urlSearchParams.entries()].reduce((acc, [key, value]) => {
    if (acc[key]) {
      if (Array.isArray(acc[key])) {
        acc[key].push(value);
      } else {
        acc[key] = [acc[key], value];
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, searchParams);

  const pathname = usePathname();
  const hash = useLocationHash();
  const reconstructedPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}${hash ? hash : ''}`;
  const parsedPath = parsePath(reconstructedPath);
  
  const routeParams = useParams();

  const location: RouterLocation = {
    hash,
    params: routeParams as Record<string,string>,
    pathname,
    // We then need to lie and pretend there aren't arrays here for backwards compatibility
    // TODO: refactor callsites to acknowledge the possibility of string arrays, or something
    query: searchParams as Record<string, string>,
    url: reconstructedPath,
    location: parsedPath,
  };

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
  
  return <LocationContext.Provider value={locationContext.current}>
    <NavigationContext.Provider value={navigationContext.current}>
      <SubscribeLocationContext.Provider value={subscribeLocationContext.current}>
        {children}
      </SubscribeLocationContext.Provider>
    </NavigationContext.Provider>
  </LocationContext.Provider>
}

/**
 * Get the hash part of the URL (ie #anchor). During SSR, this will be blank
 * (because it's not part of the request).
 */
function useLocationHash() {
  const [hash, setHash] = useState("");
  
  // HACK: There is no nextjs API for getting the hash, or triggering rerenders
  // when the hash changes, and the browser-builtin `hashchange` event doesn't
  // fire when using history.pushState/history.replaceState. However,
  // `useParams` (which is technically not the right thing) _does_ reliably
  // trigger rerenders in this case. This trick is undocumented and comes from
  // https://github.com/vercel/next.js/issues/69256 so it is likely to break in
  // the future. This is replacing a previous trick we were using for the same
  // purpose, which broke. There is no documented way whatsoever to access
  // window.location.hash safely in nextjs.
  const params = useParams();
  useEffect(() => {
    const newHash = window.location.hash;
    setHash(newHash);
  }, [params]);
  
  return hash;
}

const ClientAppGenerator = ({ abTestGroupsUsed, children }: {
  abTestGroupsUsed: RelevantTestGroupAllocation,
  children: React.ReactNode,
}) => {
  const universalCookies = useGetUniversalCookies();
  const urlSearchParams = useSearchParams();
  const loginToken = universalCookies.get('loginToken');

  return <EnableSuspenseContext.Provider value={isServer}>
    <ApolloWrapper
      loginToken={loginToken ?? null}
      searchParams={Object.fromEntries(urlSearchParams.entries())}
    >
      <CookiesProvider cookies={universalCookies}>
        <UserContextProvider>
          <ThemeContextProvider>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
                <HelmetProvider>
                  <LocationContextProvider>
                    <MessageContextProvider>
                      <Layout>
                        {children}
                      </Layout>
                    </MessageContextProvider>
                  </LocationContextProvider>
                </HelmetProvider>
            </ABTestGroupsUsedContext.Provider>
          </ThemeContextProvider>
        </UserContextProvider>
      </CookiesProvider>
    </ApolloWrapper>
  </EnableSuspenseContext.Provider>
};

const useGetUniversalCookies = () => {
  if (isServer) {
    const { cookies } = use(import('next/headers'));
    const serverCookies = use(cookies());
    const parsedCookies = serverCookies.getAll();
    return new Cookies(Object.fromEntries(parsedCookies.map((cookie) => [cookie.name, cookie.value])));
  } else {
    const browserCookies = document.cookie;
    const parsedCookies = browserCookies.split(';').map((cookie) => {
      const [name, value] = cookie.split('=');
      return { name, value };
    });
    return new Cookies(browserCookies);
  }
}

export const EnvironmentOverrideContextProvider = ({ssrMetadata, children}: {
  ssrMetadata: SSRMetadata
  children: React.ReactNode
}) => {
  const [envOverride, setEnvOverride] = useState<Partial<SSRMetadata>>(ssrMetadata ? {
    ...ssrMetadata,
  } : {});

  return <EnvironmentOverrideContext.Provider value={envOverride}>
    {children}
  </EnvironmentOverrideContext.Provider>
}

export default ClientAppGenerator;
