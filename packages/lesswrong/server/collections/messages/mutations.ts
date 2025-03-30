
import schema from "@/lib/collections/messages/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { addParticipantIfNew, checkIfNewMessageIsEmpty, sendMessageNotifications, unArchiveConversations, updateConversationActivity, updateUserNotesOnModMessage } from "@/server/callbacks/messageCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

async function newCheck(user: DbUser | null, document: DbMessage | null, context: ResolverContext) {
  const { Conversations } = context;
  if (!user || !document) return false;
  const conversation = await Conversations.findOne({_id: document.conversationId})
  return conversation && conversation.participantIds.includes(user._id)
    ? userCanDo(user, 'messages.new.own')
    : userCanDo(user, `messages.new.all`)
}

async function editCheck(user: DbUser | null, document: DbMessage | null, context: ResolverContext) {
  const { Conversations } = context;
  if (!user || !document) return false;
  const conversation = await Conversations.findOne({_id: document.conversationId})
  return conversation && conversation.participantIds.includes(user._id)
    ? userCanDo(user, 'messages.edit.own')
    : userCanDo(user, `messages.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Messages', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Messages', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    checkIfNewMessageIsEmpty(data);

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Messages', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Messages',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    unArchiveConversations(asyncProperties);
    await updateUserNotesOnModMessage(asyncProperties);
    await addParticipantIfNew(asyncProperties);  

    await updateConversationActivity(documentWithId, context);
    await sendMessageNotifications(documentWithId, context);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Messages', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }, context) => {
    const { currentUser, Messages } = context;

    const {
      documentSelector: messageSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Messages', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Messages, messageSelector, context) ?? previewDocument as DbMessage;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Messages',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Messages', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createMessage, updateFunction as updateMessage };


export const graphqlMessageTypeDefs = gql`
  input CreateMessageInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateMessageInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createMessage(input: CreateMessageInput!): Message
    updateMessage(input: UpdateMessageInput!): Message
  }
`;
