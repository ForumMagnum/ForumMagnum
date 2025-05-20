import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { createHttpLink, createErrorLink, headerLink, dateLink } from '../lib/apollo/links';

export const createApolloClient = (baseUrl = '/'): ApolloClient<NormalizedCacheObject> => {
  const cache = new InMemoryCache();

  const cachedState = baseUrl === '/' ? window.__APOLLO_STATE__ : window.__APOLLO_FOREIGN_STATE__;
  cache.restore(cachedState ?? ""); // ssr

  return new ApolloClient({
    link: ApolloLink.from([dateLink, headerLink, createErrorLink(), createHttpLink(baseUrl)]),
    cache,
    ssrForceFetchDelay: 1,
  });
};
