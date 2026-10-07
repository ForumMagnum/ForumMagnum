import schema from "@/lib/collections/moderationLoreDocs/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null, document: DbModerationLoreDoc | null) {
  if (!user || !document) return false;
  return userIsAdminOrMod(user);
}

export async function createModerationLoreDoc({ data }: CreateModerationLoreDocInput, context: ResolverContext) {
  const { currentUser } = context;

  if (data.scope === 'user' && !data.targetUserId) {
    throw new Error("User-scoped lore requires a targetUserId");
  }

  const callbackProps = await getLegacyCreateCallbackProps('ModerationLoreDocs', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModerationLoreDocs', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ModerationLoreDocs', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateModerationLoreDoc({ selector, data }: UpdateModerationLoreDocInput, context: ResolverContext) {
  const { currentUser, ModerationLoreDocs } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: loreDocSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ModerationLoreDocs', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  const updatedDocument = await updateAndReturnDocument(data, ModerationLoreDocs, loreDocSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ModerationLoreDocs', updatedDocument, oldDocument);

  reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  backgroundTask(logFieldChanges({ currentUser, collection: ModerationLoreDocs, oldDocument, data: origData }));

  return updatedDocument;
}

export const createModerationLoreDocGqlMutation = makeGqlCreateMutation('ModerationLoreDocs', createModerationLoreDoc, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationLoreDocs', rawResult, context)
});

export const updateModerationLoreDocGqlMutation = makeGqlUpdateMutation('ModerationLoreDocs', updateModerationLoreDoc, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationLoreDocs', rawResult, context)
});

export const graphqlModerationLoreDocTypeDefs = gql`
  input CreateModerationLoreDocDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateModerationLoreDocInput {
    data: CreateModerationLoreDocDataInput!
  }

  input UpdateModerationLoreDocDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateModerationLoreDocInput {
    selector: SelectorInput!
    data: UpdateModerationLoreDocDataInput!
  }

  type ModerationLoreDocOutput {
    data: ModerationLoreDoc
  }

  extend type Mutation {
    createModerationLoreDoc(data: CreateModerationLoreDocDataInput!): ModerationLoreDocOutput
    updateModerationLoreDoc(selector: SelectorInput!, data: UpdateModerationLoreDocDataInput!): ModerationLoreDocOutput
  }
`;
