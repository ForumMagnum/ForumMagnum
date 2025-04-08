
import schema from "@/lib/collections/messages/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { addParticipantIfNew, checkIfNewMessageIsEmpty, sendMessageNotifications, unArchiveConversations, updateConversationActivity, updateUserNotesOnModMessage } from "@/server/callbacks/messageCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

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
  createFunction: async ({ data }: CreateMessageInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Messages', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    checkIfNewMessageIsEmpty(data);

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Messages', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
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

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateMessageInput, context) => {
    const { currentUser, Messages } = context;

    const {
      documentSelector: messageSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Messages', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, Messages, messageSelector, context);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Messages',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createMessageGqlMutation = makeGqlCreateMutation('Messages', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Messages', rawResult, context)
});

export const updateMessageGqlMutation = makeGqlUpdateMutation('Messages', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Messages', rawResult, context)
});


export { createFunction as createMessage, updateFunction as updateMessage };


export const graphqlMessageTypeDefs = gql`
  input CreateMessageDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateMessageInput {
    data: CreateMessageDataInput!
  }
  
  input UpdateMessageDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
