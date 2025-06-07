import schema from "@/lib/collections/ultraFeedEvents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, insertAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

export const graphqlUltraFeedEventTypeDefs = gql`
  input CreateUltraFeedEventDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateUltraFeedEventInput {
    data: CreateUltraFeedEventDataInput!
  }

  type UltraFeedEventOutput {
    data: UltraFeedEvent
  }

  extend type Mutation {
    createUltraFeedEvent(data: CreateUltraFeedEventDataInput!): UltraFeedEventOutput
  }
`;

export async function createUltraFeedEvent({ data }: CreateUltraFeedEventInput, context: ResolverContext) {
  const { currentUser } = context;
  assignUserIdToData(data, currentUser, schema);

  const document = await insertAndReturnDocument(data, 'UltraFeedEvents', context);

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('UltraFeedEvents', document);

  return document;
}

export const createUltraFeedEventGqlMutation = makeGqlCreateMutation('UltraFeedEvents', createUltraFeedEvent, {
  newCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return !!user;
  },
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UltraFeedEvents', rawResult, context)
});
