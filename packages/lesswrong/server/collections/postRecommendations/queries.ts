import schema from "@/lib/collections/postRecommendations/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostRecommendationQueryTypeDefs = gql`
  type PostRecommendation {
    ${getAllGraphQLFields(schema)}
  }
`;

export const postRecommendationGqlFieldResolvers = getFieldGqlResolvers('PostRecommendations', schema);
