import schema from "@/lib/collections/dialogueChecks/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { DialogueChecksViews } from "@/lib/collections/dialogueChecks/views";

export const graphqlDialogueCheckQueryTypeDefs = gql`
  type DialogueCheck ${ getAllGraphQLFields(schema) }
  
  input SingleDialogueCheckInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleDialogueCheckOutput {
    result: DialogueCheck
  }
  
  input DialogueCheckDefaultViewInput
  
  input DialogueChecksUserDialogueChecksInput {
    userId: String
  }
  
  input DialogueChecksUserTargetDialogueChecksInput {
    userId: String
    targetUserIds: String
  }
  
  input DialogueCheckSelector  {
    default: DialogueCheckDefaultViewInput
    userDialogueChecks: DialogueChecksUserDialogueChecksInput
    userTargetDialogueChecks: DialogueChecksUserTargetDialogueChecksInput
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
    dialogueCheck(
      input: SingleDialogueCheckInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleDialogueCheckOutput
    dialogueChecks(
      input: MultiDialogueCheckInput @deprecated(reason: "Use the selector field instead"),
      selector: DialogueCheckSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiDialogueCheckOutput
  }
`;
export const dialogueCheckGqlQueryHandlers = getDefaultResolvers('DialogueChecks', DialogueChecksViews);
export const dialogueCheckGqlFieldResolvers = getFieldGqlResolvers('DialogueChecks', schema);
