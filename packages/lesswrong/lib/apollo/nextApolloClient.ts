import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { createHttpLink, createErrorLink, headerLink } from './links';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import type { ApolloClient as ApolloClientType } from "@apollo/client"
import { ApolloLink } from "@apollo/client";

const { getClient: getClientInner, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(getSiteUrl())]),
  });
});

// TODO: This horrible cast is necessary because `@apollo/client-integration-nextjs` returns
// a `getClient` whose return type signature is pointing to an imported type which doesn't resolve
// correctly, because it's importing from `@apollo/client/index.js` rather than from `@apollo/client`.
// I assume this is some kind of packaging snafu and hopefully this will be fixed in later versions
// (along with issues like "doesn't work when using @apollo/client versions later than 4.0.0-alpha.17,
// because they shuffled around some internals and it's now trying to import functions from the wrong place")
const getClient = getClientInner as unknown as () => ApolloClientType;

export { getClient, query, PreloadQuery };