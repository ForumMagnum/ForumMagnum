import schema from "@/lib/collections/ultraFeedEvents/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUltraFeedEventQueryTypeDefs = gql`
  type UltraFeedEvent {
    ${getAllGraphQLFields(schema)}
  }
`;

export const ultraFeedEventGqlFieldResolvers = getFieldGqlResolvers('UltraFeedEvents', schema);
