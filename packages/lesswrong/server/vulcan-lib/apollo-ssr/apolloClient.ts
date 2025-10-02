import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { createSchemaLink } from '../../../lib/apollo/links';
import { makeExecutableSchema } from 'graphql-tools';
import { typeDefs, resolvers } from '../apollo-server/initGraphQL';

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context: ResolverContext | null) => {
  const cache = new InMemoryCache();

  const links: ApolloLink[] = [];
  if (context) {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    // schemaLink will fetch data directly based on the executable schema
    // context here is the resolver context
    links.push(createSchemaLink(schema, context));
  }

  const client = new ApolloClient({
    ssrMode: true,
    link: ApolloLink.from(links),
    cache,
    assumeImmutableResults: true,
  });
  await client.clearStore();
  return client;
};
