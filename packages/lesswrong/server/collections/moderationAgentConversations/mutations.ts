import schema from "@/lib/collections/moderationAgentConversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null, document: DbModerationAgentConversation | null) {
  if (!user || !document) return false;
  return userIsAdminOrMod(user);
}

export async function createModerationAgentConversation({ data }: CreateModerationAgentConversationInput, context: ResolverContext) {
  const callbackProps = await getLegacyCreateCallbackProps('ModerationAgentConversations', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModerationAgentConversations', callbackProps);
  const documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ModerationAgentConversations', documentWithId);

  return documentWithId;
}

export async function updateModerationAgentConversation({ selector, data }: UpdateModerationAgentConversationInput, context: ResolverContext) {
  const { currentUser, ModerationAgentConversations } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: conversationSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ModerationAgentConversations', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  const updatedDocument = await updateAndReturnDocument(data, ModerationAgentConversations, conversationSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ModerationAgentConversations', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: ModerationAgentConversations, oldDocument, data: origData }));

  return updatedDocument;
}

export const createModerationAgentConversationGqlMutation = makeGqlCreateMutation('ModerationAgentConversations', createModerationAgentConversation, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationAgentConversations', rawResult, context)
});

export const updateModerationAgentConversationGqlMutation = makeGqlUpdateMutation('ModerationAgentConversations', updateModerationAgentConversation, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationAgentConversations', rawResult, context)
});

export const graphqlModerationAgentConversationTypeDefs = gql`
  input CreateModerationAgentConversationDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateModerationAgentConversationInput {
    data: CreateModerationAgentConversationDataInput!
  }

  input UpdateModerationAgentConversationDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateModerationAgentConversationInput {
    selector: SelectorInput!
    data: UpdateModerationAgentConversationDataInput!
  }

  type ModerationAgentConversationOutput {
    data: ModerationAgentConversation
  }

  extend type Mutation {
    createModerationAgentConversation(data: CreateModerationAgentConversationDataInput!): ModerationAgentConversationOutput
    updateModerationAgentConversation(selector: SelectorInput!, data: UpdateModerationAgentConversationDataInput!): ModerationAgentConversationOutput
  }
`;
