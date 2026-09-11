import schema from "@/lib/collections/researchEnvironments/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function editCheck(user: DbUser | null, document: DbResearchEnvironment | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function updateResearchEnvironment(
  { selector, data }: { data: UpdateResearchEnvironmentDataInput | Partial<DbResearchEnvironment>; selector: SelectorInput },
  context: ResolverContext,
) {
  const { ResearchEnvironments } = context;
  const _id = getDocumentId(selector);
  return await updateAndReturnDocument(data, ResearchEnvironments, { _id }, context);
}

export const updateResearchEnvironmentGqlMutation = makeGqlUpdateMutation('ResearchEnvironments', updateResearchEnvironment, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchEnvironments', rawResult, context),
});

export const graphqlResearchEnvironmentTypeDefs = gql`
  input UpdateResearchEnvironmentDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateResearchEnvironmentInput {
    selector: SelectorInput!
    data: UpdateResearchEnvironmentDataInput!
  }

  type ResearchEnvironmentOutput {
    data: ResearchEnvironment
  }

  extend type Mutation {
    updateResearchEnvironment(selector: SelectorInput!, data: UpdateResearchEnvironmentDataInput!): ResearchEnvironmentOutput
  }
`;
