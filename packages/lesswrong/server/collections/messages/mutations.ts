
import schema from "@/lib/collections/messages/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { addParticipantIfNew, checkIfNewMessageIsEmpty, sendMessageNotifications, unArchiveConversations, updateConversationActivity, updateUserNotesOnModMessage } from "@/server/callbacks/messageCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
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
  createFunction: async ({ data }: CreateMessageInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Messages', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    if (!skipValidation) {
      checkIfNewMessageIsEmpty(data);
    }

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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateMessageInput, context, skipValidation?: boolean) => {
    const { currentUser, Messages } = context;

    const {
      documentSelector: messageSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Messages', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Messages', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Messages', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Messages', rawResult, context)
});


export { createFunction as createMessage, updateFunction as updateMessage };
export { wrappedCreateFunction as createMessageMutation, wrappedUpdateFunction as updateMessageMutation };


export const graphqlMessageTypeDefs = gql`
  input CreateMessageDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateMessageInput {
    data: CreateMessageDataInput!
  }
  
  input UpdateMessageDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateMessageInput {
    selector: SelectorInput!
    data: UpdateMessageDataInput!
  }
  
  type MessageOutput {
    data: Message
  }

  extend type Mutation {
    createMessage(data: CreateMessageDataInput!): MessageOutput
    updateMessage(selector: SelectorInput!, data: UpdateMessageDataInput!): MessageOutput
  }
`;
