import schema from "@/lib/collections/researchDocuments/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import { bootstrapResearchDocumentYjsState } from "@/server/research/bootstrapResearchDocument";

function newCheck(user: DbUser | null) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbResearchDocument | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function createResearchDocument({ data }: CreateResearchDocumentInput, context: ResolverContext) {
  const { currentUser } = context;
  if (!currentUser) throw new Error("Not logged in");
  assignUserIdToData(data, currentUser, schema);

  const documentWithId = await insertAndReturnDocument({
    userId: currentUser._id,
    projectId: data.projectId,
    title: data.title ?? null,
    icon: null,
    sortOrder: null,
    contents_latest: null,
  }, 'ResearchDocuments', context);

  // Seed an empty-but-non-empty Lexical state into YjsDocuments so the first
  // agent edit (which goes through `withMainDocEditorSession`'s
  // post-sync-emptiness guard) succeeds. See design doc, "Bootstrap
  // requirement for new ResearchDocuments".
  await bootstrapResearchDocumentYjsState(documentWithId._id);

  return documentWithId;
}

export async function updateResearchDocument({ selector, data }: { data: UpdateResearchDocumentDataInput | Partial<DbResearchDocument>; selector: SelectorInput }, context: ResolverContext) {
  const { ResearchDocuments } = context;
  const _id = getDocumentId(selector);
  return await updateAndReturnDocument(data, ResearchDocuments, { _id }, context);
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
