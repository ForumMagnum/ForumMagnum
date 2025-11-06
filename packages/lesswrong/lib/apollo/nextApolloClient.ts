import { createErrorLink, headerLink } from './links';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import type { ApolloClient as ApolloClientType } from "@apollo/client"
import { ApolloLink } from "@apollo/client";
import { disableFragmentWarnings } from "graphql-tag";
import { rscSchemaLink } from "./rscSchemaLink";
import { getExecutableSchema } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { createSingleton } from '../utils/createSingleton';

export const getClient = createSingleton((): ApolloClientType => {
  // See comment on other instance of this function being invoked.
  disableFragmentWarnings();
  
  const { getClient: getClientInner, query: queryInner, PreloadQuery } = registerApolloClient(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([
        headerLink,
        createErrorLink(),
        rscSchemaLink(getExecutableSchema()),
      ]),
    });
  });
  return getClientInner();
});
