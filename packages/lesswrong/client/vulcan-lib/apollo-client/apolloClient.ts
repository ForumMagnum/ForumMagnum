import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
//import { IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
//import introspectionQueryResultData from '../../../lib/vulcan-lib/fragmentTypes.json'
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import meteorAccountsLink from './links/meteor';
import errorLink from './links/error';

export const createApolloClient = () => {
  /*const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData
  })*/
  
  const cache = new InMemoryCache({ /*fragmentMatcher*/ })
    .restore((window as any).__APOLLO_STATE__); //ssr
  
  const httpLink = new BatchHttpLink({
    uri: '/graphql',
    credentials: 'same-origin',
  });
  
  return new ApolloClient({
    link: ApolloLink.from([errorLink, meteorAccountsLink, httpLink]),
    cache
  });
};
