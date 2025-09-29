import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { LoggedOutCacheLink } from "@/server/rendering/loggedOutCacheLink";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { getExecutableSchema } from "../vulcan-lib/apollo-server/initGraphQL";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { ApolloLink } from "@apollo/client";
import { headerLink, createErrorLink, createSchemaLink } from "@/lib/apollo/links";

export async function getApolloClientForSSR({loginToken, cookies, headers, searchParams}: {
  loginToken: string|null
  cookies: ReadonlyRequestCookies,
  headers: ReadonlyHeaders,
  searchParams: Record<string, string>,
}) {
  const user = await getUser(loginToken);

  const context = computeContextFromUser({
    user,
    cookies: cookies.getAll(),
    headers: new Headers(headers),
    searchParams: new URLSearchParams(searchParams),
    isSSR: true,
  });
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
