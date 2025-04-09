
import { userCanStartConversations } from "@/lib/collections/conversations/helpers";
import schema from "@/lib/collections/conversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { conversationEditNotification, flagOrBlockUserOnManyDMs, sendUserLeavingConversationNotication } from "@/server/callbacks/conversationCallbacks";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
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


export async function createConversation({ data }: CreateConversationInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Conversations', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  await flagOrBlockUserOnManyDMs({ currentConversation: data, currentUser, context });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Conversations', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Conversations', documentWithId);

  return documentWithId;
}

export async function updateConversation({ selector, data }: { data: UpdateConversationDataInput | Partial<DbConversation>; selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, Conversations } = context;

  const {
    documentSelector: conversationSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Conversations', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  await flagOrBlockUserOnManyDMs({ currentConversation: data, oldConversation: oldDocument, currentUser, context });

  let updatedDocument = await updateAndReturnDocument(data, Conversations, conversationSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Conversations', updatedDocument, oldDocument);

  await sendUserLeavingConversationNotication(updateCallbackProperties);

  await conversationEditNotification(updatedDocument, oldDocument, currentUser, context);

  return updatedDocument;
}

export const createConversationGqlMutation = makeGqlCreateMutation('Conversations', createConversation, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});

export const updateConversationGqlMutation = makeGqlUpdateMutation('Conversations', updateConversation, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Conversations', rawResult, context)
});




export const graphqlConversationTypeDefs = gql`
  input CreateConversationDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateConversationInput {
    data: CreateConversationDataInput!
  }
  
  input UpdateConversationDataInput ${
    getUpdatableGraphQLFields(schema)
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
