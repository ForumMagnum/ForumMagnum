import schema from "@/lib/collections/researchDocuments/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { bootstrapResearchDocumentYjsState } from "@/server/research/bootstrapResearchDocument";

async function newCheck(user: DbUser | null, document: { projectId?: string } | null, context: ResolverContext) {
  if (!user || !document?.projectId) return false;
  if (userIsAdmin(user)) return true;
  // The user must own the parent project to create a document under it.
  const project = await context.ResearchProjects.findOne({ _id: document.projectId });
  return !!project && userOwns(user, project);
}

function editCheck(user: DbUser | null, document: DbResearchDocument | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function createResearchDocument({ data }: CreateResearchDocumentInput, context: ResolverContext) {
  const callbackProps = await getLegacyCreateCallbackProps('ResearchDocuments', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, context.currentUser, schema);

  data = callbackProps.document;
  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ResearchDocuments', callbackProps);
  const documentWithId = afterCreateProperties.document;

  // Seed an empty-but-non-empty Lexical state into YjsDocuments so the first
  // agent edit (which goes through `withMainDocEditorSession`'s
  // post-sync-emptiness guard) succeeds. See design doc, "Bootstrap
  // requirement for new ResearchDocuments".
  backgroundTask(bootstrapResearchDocumentYjsState(documentWithId._id));

  return documentWithId;
}

export async function updateResearchDocument({ selector, data }: { data: UpdateResearchDocumentDataInput | Partial<DbResearchDocument>; selector: SelectorInput }, context: ResolverContext) {
  const { ResearchDocuments } = context;
  const { documentSelector, updateCallbackProperties } = await getLegacyUpdateCallbackProps('ResearchDocuments', { selector, context, data, schema });
  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);
  return await updateAndReturnDocument(data, ResearchDocuments, documentSelector, context);
}

export const createResearchDocumentGqlMutation = makeGqlCreateMutation('ResearchDocuments', createResearchDocument, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchDocuments', rawResult, context),
});

export const updateResearchDocumentGqlMutation = makeGqlUpdateMutation('ResearchDocuments', updateResearchDocument, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ResearchDocuments', rawResult, context),
});

export const graphqlResearchDocumentTypeDefs = gql`
  input CreateResearchDocumentDataInput ${ getCreatableGraphQLFields(schema) }

  input CreateResearchDocumentInput {
    data: CreateResearchDocumentDataInput!
  }

  input UpdateResearchDocumentDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateResearchDocumentInput {
    selector: SelectorInput!
    data: UpdateResearchDocumentDataInput!
  }

  type ResearchDocumentOutput {
    data: ResearchDocument
  }

  extend type Mutation {
    createResearchDocument(data: CreateResearchDocumentDataInput!): ResearchDocumentOutput
    updateResearchDocument(selector: SelectorInput!, data: UpdateResearchDocumentDataInput!): ResearchDocumentOutput
  }
`;
