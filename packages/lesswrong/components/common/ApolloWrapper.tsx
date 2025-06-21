"use client";

import { headerLink, createErrorLink, createHttpLink } from "@/lib/apollo/links";
import { isServer } from "@/lib/executionEnvironment";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { ApolloLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(isServer ? getSiteUrl() : '/')]),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
