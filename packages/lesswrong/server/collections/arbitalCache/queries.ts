import schema from "@/lib/collections/arbitalCache/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlArbitalCachesQueryTypeDefs = gql`
  type ArbitalCaches ${
    getAllGraphQLFields(schema)
  }
`;

export const arbitalCachesGqlFieldResolvers = getFieldGqlResolvers('ArbitalCaches', schema);
