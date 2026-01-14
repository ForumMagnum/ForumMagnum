import React, { use, useCallback, useMemo } from 'react';
import { headerLink, createErrorLink, createHttpLink } from "@/lib/apollo/links";
import { isServer } from "@/lib/executionEnvironment";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { ApolloLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { ApolloNextAppProvider } from "@/lib/vendor/@apollo/client-integration-nextjs/ApolloNextAppProvider";
import { disableFragmentWarnings } from "graphql-tag";

// In the internals of apollo client, they do two round-trips that look like `gql(print(gql(options.query)))`
// This causes graphql-tag to emit warnings that look like "Warning: fragment with name PostsMinimumInfo already exists",
// because it caches fragments by name and considers them different if they have different whitespace (i.e. minified and un-minified versions).
// This is already known to the library maintainers as a bug: https://github.com/apollographql/apollo-client-integrations/issues/328#issuecomment-2254191710
// Disabling the warnings should basically be harmless as long as they're still enabled in the codegen context.
disableFragmentWarnings();

const makeApolloClientForServer = async ({ loginToken, searchParams }: {
  loginToken: string|null,
  searchParams: Record<string,string>,
}): Promise<ApolloClient> => {
  if (!isServer) {
    throw new Error("Not server");
  }

  const { cookies, headers } = await import("next/headers");
  const { getApolloClientForSSR } = await import('@/server/rendering/ssrApolloClient');
  const [serverCookies, serverHeaders] = await Promise.all([
    cookies(),
    headers()
  ]);

  return await getApolloClientForSSR({
    loginToken,
    cookies: serverCookies,
    headers: serverHeaders,
    searchParams,
  });
}

function makeApolloClientForClient({ loginToken }: {
  loginToken: string|null
}): ApolloClient {
  if (isServer) {
    throw new Error("Not client")
  }
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      createHttpLink(isServer ? getSiteUrl() : '/', loginToken)
    ])
  });

  client.prioritizeCacheValues = true;

  setTimeout(() => {
    client.prioritizeCacheValues = false;
  }, 3000);
  
  return client;
}

export const ApolloWrapper = ({ loginToken, searchParams, children }: React.PropsWithChildren<{
  loginToken: string|null,
  searchParams: Record<string, string>,
}>) => {
  // Either this is an SSR context, in which case constructing an apollo client
  // involves an async function call because of dynamic imports, or this is in
  // a client context, in which case construting an apollo client can be done
  // synchronously. We need the dynamic imports in makeApolloClientForServer
  // because if they were synchronous require() or regular imports, then
  // nextjs's bundler would try to import server-specific code and bundle it as
  // if it was client code, which fails at compile time (but it doesn't bundle
  // it this way if it's imported dynamically).
  if (isServer) {
    return (
      <ApolloWrapperServer loginToken={loginToken} searchParams={searchParams}>
        {children}
      </ApolloWrapperServer>
    );
  } else {
    return (
      <ApolloWrapperClient loginToken={loginToken} searchParams={searchParams}>
        {children}
      </ApolloWrapperClient>
    );
  }
}


const ApolloWrapperClient = ({ loginToken, searchParams, children }: React.PropsWithChildren<{
  loginToken: string|null,
  searchParams: Record<string, string>,
}>) => {
  const makeClient = useCallback(() => makeApolloClientForClient({ loginToken }), [loginToken]);
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}

const ApolloWrapperServer = React.memo(({ loginToken, searchParams, children }: React.PropsWithChildren<{
  loginToken: string|null,
  searchParams: Record<string, string>,
}>) => {
  // Construct an apollo-client for use in SSR. This is split into two
  // components, one of which creates a promise and one of which calls use()
  // on the promise, because otherwise we get double-construction (and doubling
  // of context-setup-related queries and CPU usage).
  const apolloClientPromise = makeApolloClientForServer({ loginToken, searchParams });
  return <ApolloWrapperServerAsync clientPromise={apolloClientPromise}>
    {children}
  </ApolloWrapperServerAsync>
})

const ApolloWrapperServerAsync = React.memo(({ clientPromise, children }: {
  clientPromise: Promise<ApolloClient>
  children: React.ReactNode
}) => {
  const client = use(clientPromise);
  const makeClient = useCallback(() => client, [client]);
  return <ApolloNextAppProvider makeClient={makeClient}>
    {children}
  </ApolloNextAppProvider>
});
