import schema from "@/lib/collections/moderatorActions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlModeratorActionQueryTypeDefs = gql`
  type ModeratorAction {
    ${getAllGraphQLFields(schema)}
  }

  input SingleModeratorActionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleModeratorActionOutput {
    result: ModeratorAction
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
    moderatorAction(input: SingleModeratorActionInput): SingleModeratorActionOutput
    moderatorActions(input: MultiModeratorActionInput): MultiModeratorActionOutput
  }
`;

export const moderatorActionGqlQueryHandlers = getDefaultResolvers('ModeratorActions');
export const moderatorActionGqlFieldResolvers = getFieldGqlResolvers('ModeratorActions', schema);
