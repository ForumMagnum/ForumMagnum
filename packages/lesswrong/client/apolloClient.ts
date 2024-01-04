import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { apolloCacheVoteablePossibleTypes } from '../lib/make_voteable';
import { createHttpLink, createErrorLink, headerLink } from '../lib/apollo/links';
import { Hermes } from 'apollo-cache-hermes';

export const createApolloClient = (baseUrl = '/'): ApolloClient<NormalizedCacheObject> => {
  /*const cache = new InMemoryCache({
    possibleTypes: {
      ...apolloCacheVoteablePossibleTypes()
    }
  });*/
  const cache = new Hermes({
    entityIdForNode: (node) => {
      return node._id as string|undefined;
    }
  });

  const cachedState = baseUrl === '/' ? window.__APOLLO_STATE__ : window.__APOLLO_FOREIGN_STATE__;
  cache.restore(cachedState ?? ""); // ssr

  return new ApolloClient({
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(baseUrl)]),
    cache,
  });
};
