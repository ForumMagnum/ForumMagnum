
import schema from "@/lib/collections/gardencodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds, notifyUsersOfPingbackMentions } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateGardenCodeDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'gardencode.create',
    'gardencodes.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbGardenCode | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'gardencode.update.own',
      'gardencodes.edit.own',
    ])
    : userCanDo(user, [
      'gardencode.update.all',
      'gardencodes.edit.all',
    ]);
}


export async function createGardenCode({ data }: CreateGardenCodeInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('GardenCodes', {
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

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'GardenCodes', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  documentWithId = await notifyUsersOfPingbackMentions({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('GardenCodes', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateGardenCode({ selector, data }: UpdateGardenCodeInput, context: ResolverContext) {
  const { currentUser, GardenCodes } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: gardencodeSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('GardenCodes', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, GardenCodes, gardencodeSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('GardenCodes', updatedDocument, oldDocument);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  void logFieldChanges({ currentUser, collection: GardenCodes, oldDocument, data: origData });

  return updatedDocument;
}

export const createGardenCodeGqlMutation = makeGqlCreateMutation('GardenCodes', createGardenCode, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GardenCodes', rawResult, context)
});

export const updateGardenCodeGqlMutation = makeGqlUpdateMutation('GardenCodes', updateGardenCode, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GardenCodes', rawResult, context)
});




export const graphqlGardenCodeTypeDefs = gql`
  input CreateGardenCodeDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateGardenCodeInput {
    data: CreateGardenCodeDataInput!
  }
  
  input UpdateGardenCodeDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateGardenCodeInput {
    selector: SelectorInput!
    data: UpdateGardenCodeDataInput!
  }
  
  type GardenCodeOutput {
    data: GardenCode
  }

  extend type Mutation {
    createGardenCode(data: CreateGardenCodeDataInput!): GardenCodeOutput
    updateGardenCode(selector: SelectorInput!, data: UpdateGardenCodeDataInput!): GardenCodeOutput
  }
`;
