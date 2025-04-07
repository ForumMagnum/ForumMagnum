
import { userCanStartConversations } from "@/lib/collections/conversations/helpers";
import schema from "@/lib/collections/conversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { conversationEditNotification, flagOrBlockUserOnManyDMs, sendUserLeavingConversationNotication } from "@/server/callbacks/conversationCallbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

function newCheck(user: DbUser | null, document: DbConversation | null) {
  if (!user || !document) return false;
  if (!userCanStartConversations(user)) return false
  return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.new.own')
   : userCanDo(user, `conversations.new.all`)
}

function editCheck(user: DbUser | null, document: DbConversation | null) {
  if (!user || !document) return false;
  return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.edit.own')
  : userCanDo(user, `conversations.edit.all`)
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Conversations', {
  createFunction: async ({ data }: CreateConversationInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Conversations', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await flagOrBlockUserOnManyDMs({ currentConversation: data, currentUser, context });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Conversations', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Conversations',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { data: UpdateConversationDataInput | Partial<DbConversation>; selector: SelectorInput }, context, skipValidation?: boolean) => {
    const { currentUser, Conversations } = context;

    const {
      documentSelector: conversationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Conversations', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    await flagOrBlockUserOnManyDMs({ currentConversation: data, oldConversation: oldDocument, currentUser, context });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Conversations, conversationSelector, context) ?? previewDocument as DbConversation;

    await runCountOfReferenceCallbacks({
      collectionName: 'Conversations',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await sendUserLeavingConversationNotication(updateCallbackProperties);

    await conversationEditNotification(updatedDocument, oldDocument, currentUser, context);

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Conversations', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});


export { createFunction as createConversation, updateFunction as updateConversation };
export { wrappedCreateFunction as createConversationMutation, wrappedUpdateFunction as updateConversationMutation };


export const graphqlConversationTypeDefs = gql`
  input CreateConversationDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateConversationInput {
    data: CreateConversationDataInput!
  }
  
  input UpdateConversationDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateConversationInput {
    selector: SelectorInput!
    data: UpdateConversationDataInput!
  }
  
  type ConversationOutput {
    data: Conversation
  }

  extend type Mutation {
    createConversation(data: CreateConversationDataInput!): ConversationOutput
    updateConversation(selector: SelectorInput!, data: UpdateConversationDataInput!): ConversationOutput
  }
`;
