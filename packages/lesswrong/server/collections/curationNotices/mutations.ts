import schema from "@/lib/collections/curationNotices/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateCurationNoticeDataInput | null) {
  return userIsAdminOrMod(user)
}

function editCheck(user: DbUser | null, document: DbCurationNotice | null) {
  return userIsAdminOrMod(user)
}

export async function createCurationNotice({ data }: CreateCurationNoticeInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('CurationNotices', {
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

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CurationNotices', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('CurationNotices', documentWithId);

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

export async function updateCurationNotice({ selector, data }: UpdateCurationNoticeInput, context: ResolverContext) {
  const { currentUser, CurationNotices } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: curationnoticeSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('CurationNotices', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, CurationNotices, curationnoticeSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('CurationNotices', updatedDocument, oldDocument);

  reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  backgroundTask(logFieldChanges({ currentUser, collection: CurationNotices, oldDocument, data: origData }));

  return updatedDocument;
}

export const createCurationNoticeGqlMutation = makeGqlCreateMutation('CurationNotices', createCurationNotice, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});

export const updateCurationNoticeGqlMutation = makeGqlUpdateMutation('CurationNotices', updateCurationNotice, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});




export const graphqlCurationNoticeTypeDefs = gql`
  input CreateCurationNoticeDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateCurationNoticeInput {
    data: CreateCurationNoticeDataInput!
  }
  
  input UpdateCurationNoticeDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateCurationNoticeInput {
    selector: SelectorInput!
    data: UpdateCurationNoticeDataInput!
  }
  
  type CurationNoticeOutput {
    data: CurationNotice
  }

  extend type Mutation {
    createCurationNotice(data: CreateCurationNoticeDataInput!): CurationNoticeOutput
    updateCurationNotice(selector: SelectorInput!, data: UpdateCurationNoticeDataInput!): CurationNoticeOutput
  }
`;
