
import schema from "@/lib/collections/curationNotices/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateCurationNoticeDataInput | null) {
  return userIsAdminOrMod(user)
}

function editCheck(user: DbUser | null, document: DbCurationNotice | null) {
  return userIsAdminOrMod(user)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('CurationNotices', {
  createFunction: async ({ data }: CreateCurationNoticeInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('CurationNotices', {
      context,
      data,
      schema,
      skipValidation,
    });

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

    await runCountOfReferenceCallbacks({
      collectionName: 'CurationNotices',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

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
  },

  updateFunction: async ({ selector, data }: UpdateCurationNoticeInput, context, skipValidation?: boolean) => {
    const { currentUser, CurationNotices } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: curationnoticeSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('CurationNotices', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, CurationNotices, curationnoticeSelector, context) ?? previewDocument as DbCurationNotice;

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'CurationNotices',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: CurationNotices, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('CurationNotices', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});


export { createFunction as createCurationNotice, updateFunction as updateCurationNotice };
export { wrappedCreateFunction as createCurationNoticeMutation, wrappedUpdateFunction as updateCurationNoticeMutation };


export const graphqlCurationNoticeTypeDefs = gql`
  input CreateCurationNoticeDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateCurationNoticeInput {
    data: CreateCurationNoticeDataInput!
  }
  
  input UpdateCurationNoticeDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
