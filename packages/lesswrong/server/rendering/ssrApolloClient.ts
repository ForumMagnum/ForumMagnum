import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { LoggedOutCacheLink } from "@/server/rendering/loggedOutCacheLink";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { ApolloLink } from "@apollo/client";
import { headerLink, createErrorLink } from "@/lib/apollo/links";
import { type GraphQLSchema } from "graphql";
import { SchemaLink } from "@apollo/client/link/schema";

export const createSchemaLink = (schema: GraphQLSchema, context: ResolverContext) =>
  // We are doing `context: () => ({...context})` rather than just context to fix a bug in datadog, see: https://github.com/DataDog/dd-trace-js/issues/709
  new SchemaLink({ schema, context: () => ({...context}) });

export async function getApolloClientWithContext(context: ResolverContext) {
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

export async function getResolverContextForSSR({ loginToken, cookies, headers, searchParams }: {
  loginToken: string|null
  cookies: ReadonlyRequestCookies,
  headers: ReadonlyHeaders,
  searchParams: Record<string, string>,
}): Promise<ResolverContext> {
  const user = await getUser(loginToken);

  return computeContextFromUser({
    user,
    cookies: cookies.getAll(),
    headers: new Headers(headers),
    searchParams: new URLSearchParams(searchParams),
    isSSR: true,
  });
}

export async function getApolloClientForSSRWithContext({loginToken, cookies, headers, searchParams}: {
  loginToken: string|null
  cookies: ReadonlyRequestCookies,
  headers: ReadonlyHeaders,
  searchParams: Record<string, string>,
}) {
  const context = await getResolverContextForSSR({ loginToken, cookies, headers, searchParams });

  const { getExecutableSchema } = await import("../vulcan-lib/apollo-server/initGraphQL");
  const schema = getExecutableSchema();

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      new LoggedOutCacheLink(schema),
      createSchemaLink(schema, context)
    ]),
  });

  return { client, context };
}
