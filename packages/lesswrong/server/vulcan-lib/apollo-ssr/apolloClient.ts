import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { createSchemaLink, createHttpLink, createErrorLink } from '../../../lib/apollo/links';
import { fmCrosspostBaseUrlSetting } from "../../../lib/instanceSettings";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from '../apollo-server/initGraphQL';

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context: ResolverContext | null, foreign = false) => {
  const cache = new InMemoryCache();

  const links: ApolloLink[] = [];

  if (foreign) {
    links.push(createErrorLink());
    links.push(createHttpLink(fmCrosspostBaseUrlSetting.get() ?? "/"));
  } else if (context) {
    links.push(createErrorLink());
    // links.push(createHttpLink('http://localhost:3000/'));
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    // schemaLink will fetch data directly based on the executable schema
    // context here is the resolver context
    links.push(createSchemaLink(schema, context));
  } else {
    console.error("createClient called with no context");
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
