
import schema from "@/lib/collections/gardenCodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbGardenCode>> | null, context: ResolverContext) {
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
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('GardenCodes', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'GardenCodes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
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

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'GardenCodes', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, GardenCodes } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: gardencodeSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('GardenCodes', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, GardenCodes, gardencodeSelector, context) ?? previewDocument as DbGardenCode;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'GardenCodes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: GardenCodes, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'GardenCodes', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createGardenCode, updateFunction as updateGardenCode };


export const graphqlGardenCodeTypeDefs = gql`
  input CreateGardenCodeInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateGardenCodeInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createGardenCode(input: CreateGardenCodeInput!): GardenCode
    updateGardenCode(input: UpdateGardenCodeInput!): GardenCode
  }
`;
