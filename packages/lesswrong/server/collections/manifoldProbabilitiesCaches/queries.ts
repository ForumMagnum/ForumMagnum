import schema from "@/lib/collections/manifoldProbabilitiesCaches/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlManifoldProbabilitiesCacheQueryTypeDefs = gql`
  type ManifoldProbabilitiesCache ${
    getAllGraphQLFields(schema)
  }
`;

export const manifoldProbabilitiesCacheGqlFieldResolvers = getFieldGqlResolvers('ManifoldProbabilitiesCaches', schema);
