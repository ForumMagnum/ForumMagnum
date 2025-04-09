import schema from "@/lib/collections/petrovDayActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPetrovDayActionQueryTypeDefs = gql`
  type PetrovDayAction ${
    getAllGraphQLFields(schema)
  }

  input SinglePetrovDayActionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePetrovDayActionOutput {
    result: PetrovDayAction
  }

  input MultiPetrovDayActionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPetrovDayActionOutput {
    results: [PetrovDayAction]
    totalCount: Int
  }

  extend type Query {
    petrovDayAction(input: SinglePetrovDayActionInput): SinglePetrovDayActionOutput
    petrovDayActions(input: MultiPetrovDayActionInput): MultiPetrovDayActionOutput
  }
`;

export const petrovDayActionGqlQueryHandlers = getDefaultResolvers('PetrovDayActions');
export const petrovDayActionGqlFieldResolvers = getFieldGqlResolvers('PetrovDayActions', schema);
