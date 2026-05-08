import schema from "@/lib/collections/researchProjects/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { createResearchDocument } from "@/server/collections/researchDocuments/mutations";
import { encryptClaudeCodeTokenForStorage, isEncryptedClaudeCodeTokenRef } from "@/server/research/claudeCodeTokens";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return !!user;
}

function editCheck(user: DbUser | null, document: DbResearchProject | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

function prepareClaudeCodeTokenRefForStorage(data: { claudeCodeTokenRef?: string | null }): void {
  if (!Object.prototype.hasOwnProperty.call(data, "claudeCodeTokenRef")) return;
  const tokenRef = data.claudeCodeTokenRef;
  if (tokenRef === null || tokenRef === undefined) return;
  const trimmedToken = tokenRef.trim();
  data.claudeCodeTokenRef = trimmedToken
    ? isEncryptedClaudeCodeTokenRef(trimmedToken)
      ? trimmedToken
      : encryptClaudeCodeTokenForStorage(trimmedToken)
    : null;
}

export async function createResearchProject({ data }: CreateResearchProjectInput, context: ResolverContext) {
  const callbackProps = await getLegacyCreateCallbackProps('ResearchProjects', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;
  // Stamp userId from the current user so the client doesn't have to pass it.
  assignUserIdToData(data, context.currentUser, schema);
  prepareClaudeCodeTokenRefForStorage(data);
  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ResearchProjects', callbackProps);
  const project = afterCreateProperties.document;

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
  const {
    documentSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ResearchProjects', { selector, context, data, schema });

  prepareClaudeCodeTokenRefForStorage(data);
  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);
  return await updateAndReturnDocument(data, ResearchProjects, documentSelector, context);
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
