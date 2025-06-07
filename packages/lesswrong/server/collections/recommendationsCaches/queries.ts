import schema from "@/lib/collections/recommendationsCaches/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlRecommendationsCacheQueryTypeDefs = gql`
  type RecommendationsCache ${
    getAllGraphQLFields(schema)
  }
`;

export const recommendationsCacheGqlFieldResolvers = getFieldGqlResolvers('RecommendationsCaches', schema);
