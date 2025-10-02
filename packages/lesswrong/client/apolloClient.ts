import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { createHttpLink, createErrorLink, headerLink } from '../lib/apollo/links';

export const createApolloClient = (): ApolloClient<NormalizedCacheObject> => {
  const cache = new InMemoryCache();

  cache.restore(window.__APOLLO_STATE__ ?? ""); // ssr

  return new ApolloClient({
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink("/")]),
    cache,
    ssrForceFetchDelay: 1,
  });
};
