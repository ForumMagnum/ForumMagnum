import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { apolloCacheVoteablePossibleTypes } from '../lib/make_voteable';
import { createHttpLink, createErrorLink, headerLink } from '../lib/apollo/links';

export const createApolloClient = (baseUrl = '/'): ApolloClient<NormalizedCacheObject> => {
  const cache = new InMemoryCache({
    possibleTypes: {
      ...apolloCacheVoteablePossibleTypes()
    }
  });

  const cachedState = baseUrl === '/' ? window.__APOLLO_STATE__ : window.__APOLLO_FOREIGN_STATE__;
  cache.restore(cachedState ?? ""); // ssr

  return new ApolloClient({
    uri: 'http://localhost:3000/graphql',
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink('http://localhost:3000/')]),
    cache,
  });
};
