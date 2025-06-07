
import { getRootDocument } from "@/lib/collections/multiDocuments/helpers";
import schema from "@/lib/collections/multiDocuments/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { reindexParentTagIfNeeded } from "@/server/callbacks/multiDocumentCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { editCheck as editTagCheck, newCheck as newTagCheck } from "@/server/collections/tags/helpers";

/**
 * The logic for validating whether a user can either create or update a multi-document is basically the same.
 * In both cases, we defer to the `check` defined on the parent document's collection to see if the user would be allowed to mutate the parent document.
 */
async function canMutateParentDocument(user: DbUser | null, multiDocument: DbMultiDocument | CreateMultiDocumentDataInput | null, mutation: 'create' | 'update', context: ResolverContext) {
  if (!multiDocument) {
    return false;
  }

  if (userIsAdmin(user)) {
    return true;
  }

  const rootDocumentInfo = await getRootDocument(multiDocument, context);
  if (!rootDocumentInfo) {
    return false;
  }

  const { document: parentDocument } = rootDocumentInfo;
  const check = mutation === 'create' ? newTagCheck : editTagCheck;
  return check(user, parentDocument);
}

function newCheck(user: DbUser | null, multiDocument: CreateMultiDocumentDataInput | null, context: ResolverContext) {
  return canMutateParentDocument(user, multiDocument, 'create', context);
}

export async function editCheck(user: DbUser | null, multiDocument: DbMultiDocument | null, context: ResolverContext) {
  if (!multiDocument) {
    return false;
  }

  const canEditParent = await canMutateParentDocument(user, multiDocument, 'update', context);
  if (!canEditParent) {
    return false;
  }

  // If the multi-document is deleted, we also need to check if the user owns it
  if (multiDocument.deleted) {
    return userIsAdmin(user) || userOwns(user, multiDocument);
  }

  return true;
}

export async function createMultiDocument({ data }: CreateMultiDocumentInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('MultiDocuments', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await runSlugCreateBeforeCallback(callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'MultiDocuments', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('MultiDocuments', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  reindexParentTagIfNeeded(documentWithId);

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateMultiDocument({ selector, data }: UpdateMultiDocumentInput, context: ResolverContext) {
  const { currentUser, MultiDocuments } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: multidocumentSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('MultiDocuments', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, MultiDocuments, multidocumentSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('MultiDocuments', updatedDocument, oldDocument);

  reindexParentTagIfNeeded(updatedDocument);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  void logFieldChanges({ currentUser, collection: MultiDocuments, oldDocument, data: origData });

  return updatedDocument;
}

export const createMultiDocumentGqlMutation = makeGqlCreateMutation('MultiDocuments', createMultiDocument, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'MultiDocuments', rawResult, context)
});

export const updateMultiDocumentGqlMutation = makeGqlUpdateMutation('MultiDocuments', updateMultiDocument, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'MultiDocuments', rawResult, context)
});




export const graphqlMultiDocumentTypeDefs = gql`
  input CreateMultiDocumentDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateMultiDocumentInput {
    data: CreateMultiDocumentDataInput!
  }
  
  input UpdateMultiDocumentDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateMultiDocumentInput {
    selector: SelectorInput!
    data: UpdateMultiDocumentDataInput!
  }
  
  type MultiDocumentOutput {
    data: MultiDocument
  }

  extend type Mutation {
    createMultiDocument(data: CreateMultiDocumentDataInput!): MultiDocumentOutput
    updateMultiDocument(selector: SelectorInput!, data: UpdateMultiDocumentDataInput!): MultiDocumentOutput
  }
`;
