"use client"

import '../pages/api/reactFactoryShim'
import { Geist, Geist_Mono } from "next/font/google";
import React, { Suspense } from 'react';
import { HttpLink } from '@apollo/client';
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";
// eslint-disable-next-line no-restricted-imports
import { Components } from '@/lib/vulcan-lib/components';
import { EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '@/components/hooks/useLayoutOptions';
import "./globals.css";
import { createClient } from "@/server/vulcan-lib/apollo-ssr/apolloClient";
import { ForeignApolloClientProvider } from "@/components/hooks/useForeignApolloClient";
import Layout from "@/components/Layout";

import {
  ServerRequestStatusContext,
} from '@/lib/vulcan-core/appContext'
import { MessageContextProvider } from '@/components/common/FlashMessages';
import { RefetchCurrentUserContext } from '@/components/common/withUser';
import TopPostsPage from '@/components/sequences/TopPostsPage';
import { setPublicSettings } from '@/lib/settingsCache';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';
import { ThemeContextProvider } from '@/components/themes/useTheme';
import { getDefaultThemeOptions } from '@/themes/themeNames';

export default function Providers({
  children,
  publicSettings,
}: Readonly<{
  children: React.ReactNode;
  publicSettings: any;
}>) {
  if (typeof window === 'undefined') {
    setPublicSettings(publicSettings);
  }

  function makeClient() {
    const httpLink = new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "http://localhost:3000/api/graphql",
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      fetchOptions: { cache: "no-store" },
      // you can override the default `fetchOptions` on a per query basis
      // via the `context` property on the options passed as a second argument
      // to an Apollo Client data fetching hook, e.g.:
      // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: "force-cache" }}});
    });
  
    // use the `ApolloClient` from "@apollo/experimental-nextjs-app-support"
    return new ApolloClient({
      // use the `InMemoryCache` from "@apollo/experimental-nextjs-app-support"
      cache: new InMemoryCache(),
      link: httpLink,
    });
  }

  // const apolloClient = new ApolloClient({
  //   uri: 'http://localhost:3000/api/graphql',
  //   cache: new InMemoryCache(),
  //   assumeImmutableResults: true,
  // });
  // const foreignApolloClient = new ApolloClient({
  //   cache: new InMemoryCache(),
  //   assumeImmutableResults: true,
  // });

  return (
    <ApolloNextAppProvider makeClient={makeClient}>
        <LayoutOptionsContextProvider>
          <EnvironmentOverrideContext.Provider value={{
            matchSSR: true
          }}>
            <ServerRequestStatusContext.Provider value={{}}>
              <RefetchCurrentUserContext.Provider value={() => (null as any)}>
                <MessageContextProvider>
                  <ThemeContextProvider options={getDefaultThemeOptions()}>
                    <FMJssProvider>
                      {/* <Suspense fallback={<div>Loading...</div>}> */}
                        {children}
                      {/* </Suspense> */}
                    </FMJssProvider>
                  </ThemeContextProvider>
                </MessageContextProvider>
              </RefetchCurrentUserContext.Provider>
            </ServerRequestStatusContext.Provider>
          </EnvironmentOverrideContext.Provider>
        </LayoutOptionsContextProvider>
    </ApolloNextAppProvider>
  );
}