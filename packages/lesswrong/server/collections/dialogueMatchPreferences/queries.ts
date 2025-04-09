import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDialogueMatchPreferenceQueryTypeDefs = gql`
  type DialogueMatchPreference ${
    getAllGraphQLFields(schema)
  }

  input SingleDialogueMatchPreferenceInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleDialogueMatchPreferenceOutput {
    result: DialogueMatchPreference
  }

  input MultiDialogueMatchPreferenceInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiDialogueMatchPreferenceOutput {
    results: [DialogueMatchPreference]
    totalCount: Int
  }

  extend type Query {
    dialogueMatchPreference(input: SingleDialogueMatchPreferenceInput): SingleDialogueMatchPreferenceOutput
    dialogueMatchPreferences(input: MultiDialogueMatchPreferenceInput): MultiDialogueMatchPreferenceOutput
  }
`;

export const dialogueMatchPreferenceGqlQueryHandlers = getDefaultResolvers('DialogueMatchPreferences');
export const dialogueMatchPreferenceGqlFieldResolvers = getFieldGqlResolvers('DialogueMatchPreferences', schema);
