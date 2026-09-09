import { LoggedOutCacheLink } from "@/server/rendering/loggedOutCacheLink";
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { createHttpLink, createErrorLink } from '../../../lib/apollo/links';
import { fmCrosspostBaseUrlSetting } from "../../../lib/instanceSettings";
import { createSchemaLink } from '@/server/rendering/ssrApolloClient';
import { apolloTypePolicies } from '@/lib/apollo/typePolicies';

// This client is used to prefetch data server side (necessary for SSR)
// It is recreated on every request.
export const createClient = async (context: ResolverContext, foreign = false) => {
  const cache = new InMemoryCache({ typePolicies: apolloTypePolicies });

  const links: ApolloLink[] = [];

  if (foreign) {
    links.push(createErrorLink());
    links.push(createHttpLink(fmCrosspostBaseUrlSetting.get(context) ?? "/", null, context.forumType));
  } else if (context) {
    links.push(createErrorLink());

    const { getExecutableSchema } = await import('../apollo-server/initGraphQL');

    const schema = getExecutableSchema();
    links.push(new LoggedOutCacheLink(schema, context.forumType));

    // schemaLink will fetch data directly based on the executable schema
    // context here is the resolver context
    links.push(createSchemaLink(schema, context));
  } else {
    // eslint-disable-next-line no-console
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
