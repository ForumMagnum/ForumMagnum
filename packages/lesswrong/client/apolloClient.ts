import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { apolloCacheVoteablePossibleTypes } from '../lib/make_voteable';
import { onError } from '@apollo/client/link/error';
import type { SourceLocation } from 'graphql';

const locationsToStr = (locations: readonly SourceLocation[] = []) => locations.map(({column, line}) => `line ${line}, col ${column}`).join(';');

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) => {
      const locationStr = locations && locationsToStr([...locations])
      // eslint-disable-next-line no-console
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locationStr}, Path: ${path}`);
    });
  if (networkError) {
    // eslint-disable-next-line no-console
    console.log(`[Network error]: ${networkError}`);
  }
});

export const createApolloClient = (baseUrl = '/'): ApolloClient<NormalizedCacheObject> => {
  const cache = new InMemoryCache({
    possibleTypes: {
      ...apolloCacheVoteablePossibleTypes()
    }
  })
    .restore(window.__APOLLO_STATE__); //ssr

  const httpLink = new BatchHttpLink({
    uri: baseUrl + 'graphql',
    credentials: baseUrl === '/' ? 'same-origin' : 'omit',
    batchMax: 50,
  });

  return new ApolloClient({
    link: ApolloLink.from([errorLink, httpLink]),
    cache
  });
};
