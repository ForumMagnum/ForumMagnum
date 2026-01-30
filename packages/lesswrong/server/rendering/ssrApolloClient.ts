import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { LoggedOutCacheLink } from "@/server/rendering/loggedOutCacheLink";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { ApolloLink } from "@apollo/client";
import { headerLink, createErrorLink } from "@/lib/apollo/links";
import { type GraphQLSchema } from "graphql";
import { SchemaLink } from "@apollo/client/link/schema";

export const createSchemaLink = (schema: GraphQLSchema, context: ResolverContext) =>
  // We are doing `context: () => ({...context})` rather than just context to fix a bug in datadog, see: https://github.com/DataDog/dd-trace-js/issues/709
  new SchemaLink({ schema, context: () => ({...context}) });

interface ResolverContextEntry {
  promise: Promise<ResolverContext>;
  timeoutId: ReturnType<typeof setTimeout>;
}

declare global {
  var cachedResolverContextsByRequestId: Map<string, ResolverContextEntry> | undefined;
}

function getResolverContextMap() {
  if (!globalThis.cachedResolverContextsByRequestId) {
    globalThis.cachedResolverContextsByRequestId = new Map();
  }
  return globalThis.cachedResolverContextsByRequestId;
}

async function createResolverContextForSSR(searchParamsStr: string): Promise<ResolverContext> {
  const { cookies, headers } = await import('next/headers');
  const [serverCookies, serverHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const loginToken = serverCookies.get("loginToken")?.value ?? null;
  const user = await getUser(loginToken);

  return computeContextFromUser({
    user,
    cookies: serverCookies.getAll(),
    headers: new Headers(serverHeaders),
    searchParams: new URLSearchParams(JSON.parse(searchParamsStr)),
    isSSR: true,
  });
}

/**
 * Gets a ResolverContext for use during SSR (and metadata generation), given a requestId
 * (from getRequestIdForServerComponentOrGenerateMetadata) and search params from the URL.
 * This is deduplicated between the SSR and metadata generation.
 */
export async function getResolverContextForSSR(searchParamsStr: string, requestId: string): Promise<ResolverContext> {
  const cache = getResolverContextMap();
  const existingEntry = cache.get(requestId);
  if (existingEntry) {
    return await existingEntry.promise;
  }

  const deleteResolverContextEntry = (requestId: string) => {
    const cache = getResolverContextMap();
    const entry = cache.get(requestId);
    if (entry) {
      clearTimeout(entry.timeoutId);
      cache.delete(requestId);
    }
  }

  const promise = createResolverContextForSSR(searchParamsStr);
  const timeoutId = setTimeout(() => {
    // Resolver contexts should be deleted from the request map in an after() callback
    // when the request is complete, but we also have a TTL just in case some error
    // scenario causes the after() callback to not run, so we don't leak memory.
    deleteResolverContextEntry(requestId)
  }, 30_000);
  cache.set(requestId, { promise, timeoutId });

  const { after } = await import("next/server");
  after(() => deleteResolverContextEntry(requestId));
  return await promise;
}

export async function getApolloClientForSSRWithContext(context: ResolverContext) {
  const { getExecutableSchema } = await import("../vulcan-lib/apollo-server/initGraphQL");
  const schema = getExecutableSchema();

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      new LoggedOutCacheLink(schema),
      createSchemaLink(schema, context)
    ]),
  });
}
