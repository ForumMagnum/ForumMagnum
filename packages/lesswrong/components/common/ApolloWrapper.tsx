import React, { use } from 'react';
import { headerLink, createErrorLink, createHttpLink, createSchemaLink } from "@/lib/apollo/links";
import { isServer } from "@/lib/executionEnvironment";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { ApolloLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { ApolloNextAppProvider } from "@/lib/vendor/@apollo/client-integration-nextjs/ApolloNextAppProvider";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { disableFragmentWarnings } from "graphql-tag";

// In the internals of apollo client, they do two round-trips that look like `gql(print(gql(options.query)))`
// This causes graphql-tag to emit warnings that look like "Warning: fragment with name PostsMinimumInfo already exists",
// because it caches fragments by name and considers them different if they have different whitespace (i.e. minified and un-minified versions).
// This is already known to the library maintainers as a bug: https://github.com/apollographql/apollo-client-integrations/issues/328#issuecomment-2254191710
// Disabling the warnings should basically be harmless as long as they're still enabled in the codegen context.
disableFragmentWarnings();

interface MakeClientProps {
  loginToken?: string,
  user: DbUser | null,
  searchParams: Record<string, string>,
}

async function makeApolloClientForServer({ loginToken, user, searchParams }: MakeClientProps): Promise<ApolloClient<unknown>> {
  if (!isServer) {
    throw new Error("Not server");
  }

  const { cookies, headers } = await import("next/headers");
  const serverCookies = await cookies();
  const serverHeaders = await headers();

  const { LoggedOutCacheLink } = await import("@/lib/apollo/loggedOutCacheLink");
  const { computeContextFromUser } = await import("@/server/vulcan-lib/apollo-server/context");
  const { getExecutableSchema } = await import("@/server/vulcan-lib/apollo-server/initGraphQL");

  const context = computeContextFromUser({
    user,
    cookies: serverCookies.getAll(),
    headers: new Headers(serverHeaders),
    searchParams: new URLSearchParams(searchParams),
    isSSR: true,
  });
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      new LoggedOutCacheLink(),
      createSchemaLink(getExecutableSchema(), context)
    ]),
  });
}

function makeApolloClientForClient({ loginToken, user, searchParams }: MakeClientProps): ApolloClient<unknown> {
  if (isServer) {
    throw new Error("Not client")
  }
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      createHttpLink(isServer ? getSiteUrl() : '/', loginToken)
    ]),
  });
}

export function ApolloWrapper({ loginToken, user, searchParams, children }: React.PropsWithChildren<{
  loginToken?: string,
  user: DbUser | null,
  searchParams: Record<string, string>,
}>) {
  // Either this is an SSR context, in which case constructing an apollo client
  // involves an async function call because of dynamic imports, or this is in
  // a client context, in which case construting an apollo client can be done
  // synchronously. We need the dynamic imports in makeApolloClientForServer
  // because if they were synchronous require() or regular imports, then
  // nextjs's bundler would try to import server-specific code and bundle it as
  // if it was client code, which fails at compile time (but it doesn't bundle
  // it this way if it's imported dynamically).
  if (isServer) {
    const client = use(makeApolloClientForServer({ loginToken, user, searchParams }));
    return (
      <ApolloNextAppProvider makeClient={() => client}>
        {children}
      </ApolloNextAppProvider>
    );
  } else {
    return (
      <ApolloNextAppProvider makeClient={() => makeApolloClientForClient({ loginToken, user, searchParams })}>
        {children}
      </ApolloNextAppProvider>
    );
  }
}
