import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { DialogueMatchPreferencesViews } from "@/lib/collections/dialogueMatchPreferences/views";

export const graphqlDialogueMatchPreferenceQueryTypeDefs = gql`
  type DialogueMatchPreference ${ getAllGraphQLFields(schema) }
  
  input SingleDialogueMatchPreferenceInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleDialogueMatchPreferenceOutput {
    result: DialogueMatchPreference
  }
  
  input DialogueMatchPreferenceDefaultViewInput
  
  input DialogueMatchPreferencesDialogueMatchPreferencesInput {
    dialogueCheckId: String
  }
  
  input DialogueMatchPreferenceSelector  {
    default: DialogueMatchPreferenceDefaultViewInput
    dialogueMatchPreferences: DialogueMatchPreferencesDialogueMatchPreferencesInput
  }
  
  input MultiDialogueMatchPreferenceInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiDialogueMatchPreferenceOutput {
    results: [DialogueMatchPreference]
    totalCount: Int
  }
  
  extend type Query {
    dialogueMatchPreference(
      input: SingleDialogueMatchPreferenceInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleDialogueMatchPreferenceOutput
    dialogueMatchPreferences(
      input: MultiDialogueMatchPreferenceInput @deprecated(reason: "Use the selector field instead"),
      selector: DialogueMatchPreferenceSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiDialogueMatchPreferenceOutput
  }
`;
export const dialogueMatchPreferenceGqlQueryHandlers = getDefaultResolvers('DialogueMatchPreferences', DialogueMatchPreferencesViews);
export const dialogueMatchPreferenceGqlFieldResolvers = getFieldGqlResolvers('DialogueMatchPreferences', schema);
