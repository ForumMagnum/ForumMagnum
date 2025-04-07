
import schema from "@/lib/collections/gardencodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds, notifyUsersOfPingbackMentions } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
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


const { createFunction, updateFunction } = getDefaultMutationFunctions('GardenCodes', {
  createFunction: async ({ data }: CreateGardenCodeInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('GardenCodes', {
      context,
      data,
      schema,
      skipValidation,
    });

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

    await runCountOfReferenceCallbacks({
      collectionName: 'GardenCodes',
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

  updateFunction: async ({ selector, data }: UpdateGardenCodeInput, context, skipValidation?: boolean) => {
    const { currentUser, GardenCodes } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: gardencodeSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('GardenCodes', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, GardenCodes, gardencodeSelector, context) ?? previewDocument as DbGardenCode;

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'GardenCodes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: GardenCodes, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GardenCodes', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('GardenCodes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GardenCodes', rawResult, context)
});


export { createFunction as createGardenCode, updateFunction as updateGardenCode };
export { wrappedCreateFunction as createGardenCodeMutation, wrappedUpdateFunction as updateGardenCodeMutation };


export const graphqlGardenCodeTypeDefs = gql`
  input CreateGardenCodeDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateGardenCodeInput {
    data: CreateGardenCodeDataInput!
  }
  
  input UpdateGardenCodeDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
