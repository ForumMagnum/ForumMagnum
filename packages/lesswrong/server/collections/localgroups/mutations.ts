
import schema from "@/lib/collections/localgroups/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('Localgroups', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Localgroups', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    // ****************************************************
    // TODO: add missing createValidate callbacks here!!!
    // ****************************************************

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Localgroups', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Localgroups',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // ****************************************************
    // TODO: add missing createAsync callbacks here!!!
    // ****************************************************

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Localgroups', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Localgroups } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: localgroupSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Localgroups', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    // ****************************************************
    // TODO: add missing updateValidate callbacks here!!!
    // ****************************************************

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Localgroups, localgroupSelector, context) ?? previewDocument as DbLocalgroup;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Localgroups',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // ****************************************************
    // TODO: add missing updateAsync callbacks here!!!
    // ****************************************************

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Localgroups, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Localgroups', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createLocalgroup, updateFunction as updateLocalgroup };


export const graphqlLocalgroupTypeDefs = gql`
  input CreateLocalgroupInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateLocalgroupInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createLocalgroup(input: CreateLocalgroupInput!): Localgroup
    updateLocalgroup(input: UpdateLocalgroupInput!): Localgroup
  }
`;
