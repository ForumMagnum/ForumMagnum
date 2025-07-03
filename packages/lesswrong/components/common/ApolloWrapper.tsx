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

function makeClient(loginToken?: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(isServer ? getSiteUrl() : '/', loginToken)]),
  });
}

export function ApolloWrapper({ loginToken, children }: React.PropsWithChildren<{ loginToken?: string }>) {
  return (
    <ApolloNextAppProvider makeClient={() => makeClient(loginToken)}>
      {children}
    </ApolloNextAppProvider>
  );
}
