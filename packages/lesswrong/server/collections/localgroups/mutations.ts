
import schema from "@/lib/collections/localgroups/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createGroupNotifications, handleOrganizerUpdates, validateGroupIsOnlineOrHasLocation } from "@/server/callbacks/localgroupCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
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
  createFunction: async ({ data }: CreateLocalgroupInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Localgroups', {
      context,
      data,
      schema,
    });

    data = callbackProps.document;

    validateGroupIsOnlineOrHasLocation(data);

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Localgroups', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
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

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateLocalgroupInput, context) => {
    const { currentUser, Localgroups } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: localgroupSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Localgroups', { selector, context, data, schema });

    const { oldDocument, newDocument } = updateCallbackProperties;

    validateGroupIsOnlineOrHasLocation(newDocument);

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, Localgroups, localgroupSelector, context);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
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

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Localgroups, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createLocalgroupGqlMutation = makeGqlCreateMutation('Localgroups', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Localgroups', rawResult, context)
});

export const updateLocalgroupGqlMutation = makeGqlUpdateMutation('Localgroups', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Localgroups', rawResult, context)
});


export { createFunction as createLocalgroup, updateFunction as updateLocalgroup };


export const graphqlLocalgroupTypeDefs = gql`
  input CreateLocalgroupDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateLocalgroupInput {
    data: CreateLocalgroupDataInput!
  }
  
  input UpdateLocalgroupDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateLocalgroupInput {
    selector: SelectorInput!
    data: UpdateLocalgroupDataInput!
  }
  
  type LocalgroupOutput {
    data: Localgroup
  }

  extend type Mutation {
    createLocalgroup(data: CreateLocalgroupDataInput!): LocalgroupOutput
    updateLocalgroup(selector: SelectorInput!, data: UpdateLocalgroupDataInput!): LocalgroupOutput
  }
`;
