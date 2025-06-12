import schema from "@/lib/collections/ultraFeedEvents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { convertDocumentIdToIdInSelector, UpdateSelector } from "@/lib/vulcan-lib/utils";
import gql from "graphql-tag";
import { z } from "zod";
import { logFieldChanges } from "@/server/fieldChanges";
import { userOwns } from "@/lib/vulcan-users/permissions";

const seeLessEventDataSchema = z.object({
  feedbackReasons: z.object({
    author: z.boolean().optional(),
    topic: z.boolean().optional(),
    contentType: z.boolean().optional(),
    other: z.boolean().optional(),
    text: z.string().max(500, "Feedback text must be 500 characters or less").optional(),
  }).optional(),
  cancelled: z.boolean().optional(),
});

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

export async function updateUltraFeedEvent(args: { selector: SelectorInput, data: UpdateUltraFeedEventDataInput }, context: ResolverContext) {
  const { selector, data: inputData } = args;
  const { UltraFeedEvents, currentUser } = context;

  const documentSelector = convertDocumentIdToIdInSelector(selector as UpdateSelector);
  const existingDoc = await context.loaders.UltraFeedEvents.load(documentSelector._id);
  
  if (!existingDoc) {
    throw new Error('UltraFeedEvent not found');
  }
  
  if (existingDoc.eventType !== 'seeLess') {
    throw new Error('Updates are only allowed for seeLess events');
  }
  
  if (inputData.event) {
    try {
      seeLessEventDataSchema.parse(inputData.event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid event data: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
  
  void logFieldChanges({ currentUser, collection: UltraFeedEvents, oldDocument: existingDoc, data: inputData });
  
  const updatedDocument = await updateAndReturnDocument(inputData, UltraFeedEvents, documentSelector, context);

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
    if (!user || !document) return false;
    return userOwns(user, document);
  },
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UltraFeedEvents', rawResult, context)
});
