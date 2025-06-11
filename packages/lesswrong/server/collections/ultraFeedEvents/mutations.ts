import schema from "@/lib/collections/ultraFeedEvents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { convertDocumentIdToIdInSelector, UpdateSelector } from "@/lib/vulcan-lib/utils";
import gql from "graphql-tag";

export const graphqlUltraFeedEventTypeDefs = gql`
  input CreateUltraFeedEventDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateUltraFeedEventInput {
    data: CreateUltraFeedEventDataInput!
  }

  input UpdateUltraFeedEventDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateUltraFeedEventInput {
    selector: SelectorInput!
    data: UpdateUltraFeedEventDataInput!
  }

  type UltraFeedEventOutput {
    data: UltraFeedEvent
  }

  extend type Mutation {
    createUltraFeedEvent(data: CreateUltraFeedEventDataInput!): UltraFeedEventOutput
    updateUltraFeedEvent(selector: SelectorInput!, data: UpdateUltraFeedEventDataInput!): UltraFeedEventOutput
  }
`;

export async function createUltraFeedEvent({ data }: CreateUltraFeedEventInput, context: ResolverContext) {
  const { currentUser } = context;
  assignUserIdToData(data, currentUser, schema);

  const document = await insertAndReturnDocument(data, 'UltraFeedEvents', context);

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('UltraFeedEvents', document);

  return document;
}

export async function updateUltraFeedEvent(args: { selector: SelectorInput, data: CreateUltraFeedEventDataInput }, context: ResolverContext) {
  const { selector, data: inputData } = args;
  const { UltraFeedEvents } = context;

  const documentSelector = convertDocumentIdToIdInSelector(selector as UpdateSelector);
  const existingDoc = await context.loaders.UltraFeedEvents.load(documentSelector._id);
  
  if (!existingDoc) {
    throw new Error('UltraFeedEvent not found');
  }
  
  const updateData: Partial<DbUltraFeedEvent> = {};
  if ('event' in inputData && inputData.event !== undefined) {
    updateData.event = inputData.event;
  }
  
  const updatedDocument = await updateAndReturnDocument(updateData, UltraFeedEvents, documentSelector, context);

  return updatedDocument;
}

export const createUltraFeedEventGqlMutation = makeGqlCreateMutation('UltraFeedEvents', createUltraFeedEvent, {
  newCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return !!user;
  },
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UltraFeedEvents', rawResult, context)
});

export const updateUltraFeedEventGqlMutation = makeGqlUpdateMutation('UltraFeedEvents', updateUltraFeedEvent, {
  editCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return !!user && !!document && document.userId === user._id;
  },
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UltraFeedEvents', rawResult, context)
});
