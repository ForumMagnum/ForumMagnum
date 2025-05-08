import schema from "@/lib/collections/petrovDayActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PetrovDayActionsViews } from "@/lib/collections/petrovDayActions/views";

export const graphqlPetrovDayActionQueryTypeDefs = gql`
  type PetrovDayAction ${ getAllGraphQLFields(schema) }
  
  input SinglePetrovDayActionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePetrovDayActionOutput {
    result: PetrovDayAction
  }
  
  input PetrovDayActionViewInput {
    userId: String
    actionType: String
    data: String
    side: String
   }
  
  input PetrovDayActionSelector @oneOf {
    default: PetrovDayActionViewInput
    getAction: PetrovDayActionViewInput
    launchDashboard: PetrovDayActionViewInput
    adminConsole: PetrovDayActionViewInput
    warningConsole: PetrovDayActionViewInput
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
    petrovDayAction(
      input: SinglePetrovDayActionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePetrovDayActionOutput
    petrovDayActions(
      input: MultiPetrovDayActionInput @deprecated(reason: "Use the selector field instead"),
      selector: PetrovDayActionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPetrovDayActionOutput
  }
`;
export const petrovDayActionGqlQueryHandlers = getDefaultResolvers('PetrovDayActions', PetrovDayActionsViews);
export const petrovDayActionGqlFieldResolvers = getFieldGqlResolvers('PetrovDayActions', schema);
