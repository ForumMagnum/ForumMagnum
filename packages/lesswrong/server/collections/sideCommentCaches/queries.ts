import schema from "@/lib/collections/sideCommentCaches/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSideCommentCacheQueryTypeDefs = gql`
  type SideCommentCache {
    ${getAllGraphQLFields(schema)}
  }
`;

export const sideCommentCacheGqlFieldResolvers = getFieldGqlResolvers('SideCommentCaches', schema);
