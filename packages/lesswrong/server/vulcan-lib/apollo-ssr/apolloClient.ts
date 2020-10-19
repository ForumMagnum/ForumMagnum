import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import { getExecutableSchema } from '../apollo-server/initGraphQL';
import { ApolloLink } from 'apollo-link';

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context) => {
  const cache = new InMemoryCache();
  const schema = getExecutableSchema();
  
  // schemaLink will fetch data directly based on the executable schema
  // context here is the resolver context
  const schemaLink = new SchemaLink({ schema, context });
  const client = new ApolloClient({
    ssrMode: true,
    link: ApolloLink.from([schemaLink]),
    cache,
    assumeImmutableResults: true,
  });
  return client;
};
