import schema from "@/lib/collections/moderatorActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModeratorActionsViews } from "@/lib/collections/moderatorActions/views";

export const graphqlModeratorActionQueryTypeDefs = gql`
  type ModeratorAction ${ getAllGraphQLFields(schema) }
  
  input SingleModeratorActionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleModeratorActionOutput {
    result: ModeratorAction
  }
  
  input ModeratorActionViewInput {
    limit: String
    offset: String
    orderBy: String
    userIds: [String!]
   }
  
  input ModeratorActionSelector @oneOf {
    default: ModeratorActionViewInput
    userModeratorActions: ModeratorActionViewInput
    restrictionModerationActions: ModeratorActionViewInput
  }
  
  input MultiModeratorActionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiModeratorActionOutput {
    results: [ModeratorAction]
    totalCount: Int
  }
  
  extend type Query {
    moderatorAction(
      input: SingleModeratorActionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModeratorActionOutput
    moderatorActions(
      input: MultiModeratorActionInput @deprecated(reason: "Use the selector field instead"),
      selector: ModeratorActionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModeratorActionOutput
  }
`;
export const moderatorActionGqlQueryHandlers = getDefaultResolvers('ModeratorActions', ModeratorActionsViews);
export const moderatorActionGqlFieldResolvers = getFieldGqlResolvers('ModeratorActions', schema);
