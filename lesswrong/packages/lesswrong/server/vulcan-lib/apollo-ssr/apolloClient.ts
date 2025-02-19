import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { apolloCacheVoteablePossibleTypes } from '../../../lib/make_voteable';
import { getExecutableSchema } from '../apollo-server/initGraphQL';
import { createSchemaLink, createHttpLink, createErrorLink } from '../../../lib/apollo/links';
import { fmCrosspostBaseUrlSetting } from "../../../lib/instanceSettings";

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context: ResolverContext | null, foreign = false) => {
  const cache = new InMemoryCache({
    possibleTypes: {
      ...apolloCacheVoteablePossibleTypes()
    }
  });

  const links: ApolloLink[] = [];

  if (foreign) {
    links.push(createErrorLink());
    links.push(createHttpLink(fmCrosspostBaseUrlSetting.get() ?? "/"));
  } else if (context) {
    const schema = getExecutableSchema();
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
