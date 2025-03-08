"use client"

import '../pages/api/reactFactoryShim'
import '@/lib/vulcan-lib/allFragments'
import '@/lib/collections/notifications/collection'
import '@/lib/collections/llmConversations/collection'
import '@/lib/collections/forumEvents/collection'
import React, { Suspense } from 'react';
import { HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";
import { EnvironmentOverrideContext } from '@/lib/utils/timeUtil';
import { LayoutOptionsContextProvider } from '@/components/hooks/useLayoutOptions';
import "./globals.css";

import {
  ServerRequestStatusContext,
} from '@/lib/vulcan-core/appContext'

import { MessageContextProvider } from '@/components/common/FlashMessages';
import { RefetchCurrentUserContext } from '@/components/common/withUser';
import { setPublicSettings } from '@/lib/settingsCache';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';
import { ThemeContextProvider } from '@/components/themes/useTheme';
import { getDefaultThemeOptions } from '@/themes/themeNames';
import SidebarsWrapper from '@/components/common/SidebarsWrapper';
import { Layout } from '@/components/Layout';

export default function Providers({
  children,
  publicSettings,
  loginToken,
}: Readonly<{
  children: React.ReactNode;
  publicSettings: any;
  loginToken: string | undefined;
}>) {
  if (typeof window === 'undefined') {
    setPublicSettings(publicSettings);
  }

  function makeClient() {
    console.log("makeClient", { loginToken }, `Bearer ${loginToken}`)
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: loginToken ? `Bearer ${loginToken}` : undefined,
        },
      }
    })
    const httpLink = new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "http://localhost:3000/api/graphql",
      credentials: 'same-origin',
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      // fetchOptions: { cache: "no-store" },
      // you can override the default `fetchOptions` on a per query basis
      // via the `context` property on the options passed as a second argument
      // to an Apollo Client data fetching hook, e.g.:
      // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: "force-cache" }}});
    });

    // use the `ApolloClient` from "@apollo/experimental-nextjs-app-support"
    return new ApolloClient({
      // use the `InMemoryCache` from "@apollo/experimental-nextjs-app-support"
      cache: new InMemoryCache(),
      link: authLink.concat(httpLink),
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
          <Suspense>
            <ServerRequestStatusContext.Provider value={{}}>
              <RefetchCurrentUserContext.Provider value={() => (null as any)}>
                <MessageContextProvider>
                  <ThemeContextProvider options={getDefaultThemeOptions()}>
                    <FMJssProvider>
                      <SidebarsWrapper>
                        <Layout>
                          {/* <Suspense fallback={<div>Loading...</div>}> */}
                          {children}
                          {/* </Suspense> */}
                        </Layout>
                      </SidebarsWrapper>
                    </FMJssProvider>
                  </ThemeContextProvider>
                </MessageContextProvider>
              </RefetchCurrentUserContext.Provider>
            </ServerRequestStatusContext.Provider>
          </Suspense>
        </EnvironmentOverrideContext.Provider>
      </LayoutOptionsContextProvider>
    </ApolloNextAppProvider>
  );
}