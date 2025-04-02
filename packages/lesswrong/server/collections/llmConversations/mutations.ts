
import schema from "@/lib/collections/llmConversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkUpdatePermissionsAndReturnProps, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function editCheck(user: DbUser | null, document: DbLlmConversation | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { updateFunction } = getDefaultMutationFunctions('LlmConversations', {
  // LlmConversations don't have a "default" create function; they're created when necessary in the `/api/sendLlmChat` endpoint

  updateFunction: async ({ selector, data }: UpdateLlmConversationInput, context, skipValidation?: boolean) => {
    const { currentUser, LlmConversations } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: llmconversationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('LlmConversations', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, LlmConversations, llmconversationSelector, context) ?? previewDocument as DbLlmConversation;

    await runCountOfReferenceCallbacks({
      collectionName: 'LlmConversations',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: LlmConversations, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('LlmConversations', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LlmConversations', rawResult, context)
});


export { updateFunction as updateLlmConversation };
export { wrappedUpdateFunction as updateLlmConversationMutation };


export const graphqlLlmConversationTypeDefs = gql`
  input UpdateLlmConversationDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateLlmConversationInput {
    selector: SelectorInput!
    data: UpdateLlmConversationDataInput!
  }
  
  extend type Mutation {
    updateLlmConversation(input: UpdateLlmConversationInput!): LlmConversation
  }
`;
