
import schema from "@/lib/collections/localgroups/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createGroupNotifications, handleOrganizerUpdates, validateGroupIsOnlineOrHasLocation } from "@/server/callbacks/localgroupCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateLocalgroupDataInput | null) {
  if (!user || !document) return false;
  return document.organizerIds.includes(user._id)
    ? userCanDo(user, 'localgroups.new.own')
    : userCanDo(user, `localgroups.new.all`)
}

function editCheck(user: DbUser | null, document: DbLocalgroup | null) {
  if (!user || !document) return false;
  return document.organizerIds.includes(user._id)
    ? userCanDo(user, 'localgroups.edit.own')
    : userCanDo(user, `localgroups.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Localgroups', {
  createFunction: async ({ data }: CreateLocalgroupInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Localgroups', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    validateGroupIsOnlineOrHasLocation(data);

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

    await createGroupNotifications(asyncProperties);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateLocalgroupInput, context, skipValidation?: boolean) => {
    const { currentUser, Localgroups } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: localgroupSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Localgroups', { selector, context, data, schema, skipValidation });

    const { oldDocument, newDocument } = updateCallbackProperties;

    validateGroupIsOnlineOrHasLocation(newDocument);

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

    await handleOrganizerUpdates(updateCallbackProperties);

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Localgroups, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Localgroups', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Localgroups', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Localgroups', rawResult, context)
});


export { createFunction as createLocalgroup, updateFunction as updateLocalgroup };
export { wrappedCreateFunction as createLocalgroupMutation, wrappedUpdateFunction as updateLocalgroupMutation };


export const graphqlLocalgroupTypeDefs = gql`
  input CreateLocalgroupDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateLocalgroupInput {
    data: CreateLocalgroupDataInput!
  }
  
  input UpdateLocalgroupDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateLocalgroupInput {
    selector: SelectorInput!
    data: UpdateLocalgroupDataInput!
  }
  
  extend type Mutation {
    createLocalgroup(input: CreateLocalgroupInput!): Localgroup
    updateLocalgroup(input: UpdateLocalgroupInput!): Localgroup
  }
`;
