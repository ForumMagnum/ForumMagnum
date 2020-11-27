import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { apolloCacheVoteablePossibleTypes } from '../../../lib/make_voteable';
import meteorAccountsLink from './links/meteor';
import errorLink from './links/error';

export const createApolloClient = () => {
  const cache = new InMemoryCache({
    possibleTypes: {
      ...apolloCacheVoteablePossibleTypes()
    }
  })
    .restore((window as any).__APOLLO_STATE__); //ssr
  
  const httpLink = new BatchHttpLink({
    uri: '/graphql',
    credentials: 'same-origin',
    batchMax: 50,
  });
  
  return new ApolloClient({
    link: ApolloLink.from([errorLink, meteorAccountsLink, httpLink]),
    cache
  });
};
