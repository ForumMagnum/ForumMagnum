import React from 'react';
import { headerLink, createErrorLink, createHttpLink, createSchemaLink } from "@/lib/apollo/links";
import { isServer } from "@/lib/executionEnvironment";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { ApolloLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { ApolloNextAppProvider } from "@/lib/vendor/@apollo/client-integration-nextjs/ApolloNextAppProvider";
import type { GraphQLSchema } from "graphql";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { typeDefs, resolvers } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { disableFragmentWarnings } from "graphql-tag";

// In the internals of apollo client, they do two round-trips that look like `gql(print(gql(options.query)))`
// This causes graphql-tag to emit warnings that look like "Warning: fragment with name PostsMinimumInfo already exists",
// because it caches fragments by name and considers them different if they have different whitespace (i.e. minified and un-minified versions).
// This is already known to the library maintainers as a bug: https://github.com/apollographql/apollo-client-integrations/issues/328#issuecomment-2254191710
// Disabling the warnings should basically be harmless as long as they're still enabled in the codegen context.
disableFragmentWarnings();

const getExecutableSchema = (() => {
  let _executableSchema: GraphQLSchema|null = null;
  return () => {
    if (!_executableSchema) {
      const { makeExecutableSchema }: typeof import("@graphql-tools/schema") = require("@graphql-tools/schema");
      _executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    }
    return _executableSchema;  
  };
})()

interface MakeClientProps {
  loginToken?: string,
  user: DbUser | null,
  cookies: RequestCookie[],
  headers: Record<string, string>,
  searchParams: Record<string, string>,
}

function makeClient({ loginToken, user, cookies, headers, searchParams }: MakeClientProps) {
  const links = [
    headerLink,
    createErrorLink(),
  ];
  if (isServer) {
    const { LoggedOutCacheLink }: typeof import("@/lib/apollo/loggedOutCacheLink") = require("@/lib/apollo/loggedOutCacheLink");
    links.push(new LoggedOutCacheLink());

    const { computeContextFromUser }: typeof import("@/server/vulcan-lib/apollo-server/context") = require("@/server/vulcan-lib/apollo-server/context");

    const context = computeContextFromUser({
      user,
      cookies,
      headers: new Headers(headers),
      searchParams: new URLSearchParams(searchParams),
      isSSR: true,
    });
    links.push(createSchemaLink(getExecutableSchema(), context));
  } else {
    links.push(createHttpLink(isServer ? getSiteUrl() : '/', loginToken, headers));
  }
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from(links),
  });
}

export function ApolloWrapper({ loginToken, user, cookies, headers, searchParams, children }: React.PropsWithChildren<{
  loginToken?: string,
  user: DbUser | null,
  cookies: RequestCookie[],
  headers: Record<string, string>,
  searchParams: Record<string, string>,
}>) {
  return (
    <ApolloNextAppProvider makeClient={() => makeClient({ loginToken, user, cookies, headers, searchParams })}>
      {children}
    </ApolloNextAppProvider>
  );
}
