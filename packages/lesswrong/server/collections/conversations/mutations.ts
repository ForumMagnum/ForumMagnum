
import { userCanStartConversations } from "@/lib/collections/conversations/helpers";
import schema from "@/lib/collections/conversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { conversationEditNotification, flagOrBlockUserOnManyDMs, sendUserLeavingConversationNotication } from "@/server/callbacks/conversationCallbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

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
  createFunction: async ({ data }: CreateConversationInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Conversations', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

  updateFunction: async ({ selector, data }: { data: UpdateConversationDataInput | Partial<DbConversation>; selector: SelectorInput }, context) => {
    const { currentUser, Conversations } = context;

    const {
      documentSelector: conversationSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Conversations', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    await flagOrBlockUserOnManyDMs({ currentConversation: data, oldConversation: oldDocument, currentUser, context });

    let updatedDocument = await updateAndReturnDocument(data, Conversations, conversationSelector, context);

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

export const createConversationGqlMutation = makeGqlCreateMutation('Conversations', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});

export const updateConversationGqlMutation = makeGqlUpdateMutation('Conversations', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});


export { createFunction as createConversation, updateFunction as updateConversation };


export const graphqlConversationTypeDefs = gql`
  input CreateConversationDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateConversationInput {
    data: CreateConversationDataInput!
  }
  
  input UpdateConversationDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
