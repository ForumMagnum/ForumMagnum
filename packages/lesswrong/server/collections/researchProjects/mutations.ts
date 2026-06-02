import schema from "@/lib/collections/researchProjects/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { createResearchDocument } from "@/server/collections/researchDocuments/mutations";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbResearchProject | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function createResearchProject({ data }: CreateResearchProjectInput, context: ResolverContext) {
  const { currentUser } = context;
  if (!currentUser) throw new Error("Not logged in");
  assignUserIdToData(data, currentUser, schema);

  const project = await insertAndReturnDocument({
    userId: currentUser._id,
    title: data.title,
    description: data.description ?? null,
    settings: data.settings ?? null,
  }, 'ResearchProjects', context);

  // Auto-create an empty default document so a freshly opened project lands
  // straight into editing. Failures here are non-fatal — the project itself
  // exists, and the user can still create documents from the sidebar.
  try {
    await createResearchDocument({ data: { projectId: project._id, title: null } }, context);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[research] Failed to create default document for project", project._id, err);
  }

  return project;
}

export async function updateResearchProject({ selector, data }: { data: UpdateResearchProjectDataInput | Partial<DbResearchProject>; selector: SelectorInput }, context: ResolverContext) {
  const { ResearchProjects } = context;
  const _id = getDocumentId(selector);
  return await updateAndReturnDocument(data, ResearchProjects, { _id }, context);
}

export const createResearchProjectGqlMutation = makeGqlCreateMutation('ResearchProjects', createResearchProject, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchProjects', rawResult, context),
});

export const updateResearchProjectGqlMutation = makeGqlUpdateMutation('ResearchProjects', updateResearchProject, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchProjects', rawResult, context),
});

export const graphqlResearchProjectTypeDefs = gql`
  input CreateResearchProjectDataInput ${ getCreatableGraphQLFields(schema) }

  input CreateResearchProjectInput {
    data: CreateResearchProjectDataInput!
  }

  input UpdateResearchProjectDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateResearchProjectInput {
    selector: SelectorInput!
    data: UpdateResearchProjectDataInput!
  }

  type ResearchProjectOutput {
    data: ResearchProject
  }

  extend type Mutation {
    createResearchProject(data: CreateResearchProjectDataInput!): ResearchProjectOutput
    updateResearchProject(selector: SelectorInput!, data: UpdateResearchProjectDataInput!): ResearchProjectOutput
  }
`;
