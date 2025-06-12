import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { createHttpLink, createErrorLink, headerLink } from '../lib/apollo/links';

export const createApolloClient = (baseUrl = '/'): ApolloClient => {
  const cache = new InMemoryCache();

  const cachedState = baseUrl === '/' ? window.__APOLLO_STATE__ : window.__APOLLO_FOREIGN_STATE__;
  cache.restore(cachedState ?? ""); // ssr

  return new ApolloClient({
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(baseUrl)]),
    cache,
  });
};
