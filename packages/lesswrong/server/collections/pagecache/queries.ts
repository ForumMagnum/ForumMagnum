import schema from "@/lib/collections/pagecache/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPageCacheEntryQueryTypeDefs = gql`
  type PageCacheEntry {
    ${getAllGraphQLFields(schema)}
  }
`;

export const pageCacheEntryGqlFieldResolvers = getFieldGqlResolvers('PageCache', schema);
