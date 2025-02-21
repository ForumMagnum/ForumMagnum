"use client"

import '../pages/api/reactFactoryShim'
import { Geist, Geist_Mono } from "next/font/google";
import React from 'react';
import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache } from '@apollo/client';
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

  const apolloClient = new ApolloClient({
    uri: 'http://localhost:3000/api/graphql',
    ssrMode: true,
    cache: new InMemoryCache(),
    assumeImmutableResults: true,
  });
  const foreignApolloClient = new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),
    assumeImmutableResults: true,
  });

  return (
    <ApolloProvider client={apolloClient}>
      <ForeignApolloClientProvider value={foreignApolloClient}>
        <LayoutOptionsContextProvider>
          <EnvironmentOverrideContext.Provider value={{
            matchSSR: true
          }}>
            <ServerRequestStatusContext.Provider value={{}}>
              <RefetchCurrentUserContext.Provider value={() => (null as any)}>
                <MessageContextProvider>
                  <ThemeContextProvider options={getDefaultThemeOptions()}>
                    <FMJssProvider>
                      <TopPostsPage />
                    </FMJssProvider>
                  </ThemeContextProvider>
                </MessageContextProvider>
              </RefetchCurrentUserContext.Provider>
            </ServerRequestStatusContext.Provider>
          </EnvironmentOverrideContext.Provider>
        </LayoutOptionsContextProvider>
      </ForeignApolloClientProvider>
    </ApolloProvider>
  );
}