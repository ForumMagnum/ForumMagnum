import schema from "@/lib/collections/petrovDayLaunchs/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPetrovDayLaunchQueryTypeDefs = gql`
  type PetrovDayLaunch ${
    getAllGraphQLFields(schema)
  }
`;

export const petrovDayLaunchGqlFieldResolvers = getFieldGqlResolvers('PetrovDayLaunchs', schema);
