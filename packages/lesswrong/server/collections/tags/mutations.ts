import schema from "@/lib/collections/tags/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { cascadeSoftDeleteToTagRels, reexportProfileTagUsersToElastic, updateParentTagSubTagIds, validateTagCreate, validateTagUpdate } from "@/server/callbacks/tagCallbackFunctions";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds, notifyUsersOfPingbackMentions } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { newCheck, editCheck } from "./helpers";

export async function createTag({ data }: CreateTagInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Tags', {
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

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Tags', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  documentWithId = await notifyUsersOfPingbackMentions({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Tags', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  if (isElasticEnabled) {
    void elasticSyncDocument('Tags', documentWithId._id);
  }

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateTag({ selector, data }: UpdateTagInput, context: ResolverContext) {
  const { currentUser, Tags } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: tagSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Tags', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, Tags, tagSelector, context);

  updatedDocument = await cascadeSoftDeleteToTagRels(updatedDocument, updateCallbackProperties);
  updatedDocument = await updateParentTagSubTagIds(updatedDocument, updateCallbackProperties);
  updatedDocument = await reexportProfileTagUsersToElastic(updatedDocument, updateCallbackProperties);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Tags', updatedDocument, oldDocument);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  if (isElasticEnabled) {
    void elasticSyncDocument('Tags', updatedDocument._id);
  }

  void logFieldChanges({ currentUser, collection: Tags, oldDocument, data: origData });

  return updatedDocument;
}

export const createTagGqlMutation = makeGqlCreateMutation('Tags', createTag, {
  newCheck: async (user, tag: CreateTagDataInput | null, context) => newCheck(user, tag) && await validateTagCreate(tag, context),
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});

export const updateTagGqlMutation = makeGqlUpdateMutation('Tags', updateTag, {
  editCheck: async (user, tag: DbTag, context, previewTag) => editCheck(user, tag) && await validateTagUpdate(tag, previewTag, context),
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});




export const graphqlTagTypeDefs = gql`
  input CreateTagDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateTagInput {
    data: CreateTagDataInput!
  }
  
  input UpdateTagDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateTagInput {
    selector: SelectorInput!
    data: UpdateTagDataInput!
  }
  
  type TagOutput {
    data: Tag
  }

  extend type Mutation {
    createTag(data: CreateTagDataInput!): TagOutput
    updateTag(selector: SelectorInput!, data: UpdateTagDataInput!): TagOutput
  }
`;
