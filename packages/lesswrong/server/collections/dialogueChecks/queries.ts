import schema from "@/lib/collections/dialogueChecks/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDialogueCheckQueryTypeDefs = gql`
  type DialogueCheck {
    ${getAllGraphQLFields(schema)}
  }

  input SingleDialogueCheckInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleDialogueCheckOutput {
    result: DialogueCheck
  }

  input MultiDialogueCheckInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiDialogueCheckOutput {
    results: [DialogueCheck]
    totalCount: Int
  }

  extend type Query {
    dialogueCheck(input: SingleDialogueCheckInput): SingleDialogueCheckOutput
    dialogueChecks(input: MultiDialogueCheckInput): MultiDialogueCheckOutput
  }
`;

export const dialogueCheckGqlQueryHandlers = getDefaultResolvers('DialogueChecks');
export const dialogueCheckGqlFieldResolvers = getFieldGqlResolvers('DialogueChecks', schema);
