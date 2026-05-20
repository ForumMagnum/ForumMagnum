import schema from "@/lib/collections/researchConversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

// Conversations are created server-side by `fireResearchConversation`, not via
// a generic createResearchConversation mutation — so this file only exposes
// the `update` shape, primarily for user-edited titles.

function editCheck(user: DbUser | null, document: DbResearchConversation | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function updateResearchConversation(
  { selector, data }: { data: UpdateResearchConversationDataInput | Partial<DbResearchConversation>; selector: SelectorInput },
  context: ResolverContext,
) {
  const { ResearchConversations } = context;
  const _id = getDocumentId(selector);
  return await updateAndReturnDocument(data, ResearchConversations, { _id }, context);
}

export const updateResearchConversationGqlMutation = makeGqlUpdateMutation('ResearchConversations', updateResearchConversation, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchConversations', rawResult, context),
});

export const graphqlResearchConversationTypeDefs = gql`
  input UpdateResearchConversationDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateResearchConversationInput {
    selector: SelectorInput!
    data: UpdateResearchConversationDataInput!
  }

  type ResearchConversationOutput {
    data: ResearchConversation
  }

  extend type Mutation {
    updateResearchConversation(selector: SelectorInput!, data: UpdateResearchConversationDataInput!): ResearchConversationOutput
  }
`;
