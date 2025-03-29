
import schema from "@/lib/collections/notifications/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('Notifications', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Notifications', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Notifications', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Notifications',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Notifications', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Notifications } = context;

    const {
      documentSelector: notificationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Notifications', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Notifications, notificationSelector, context) ?? previewDocument as DbNotification;

    await runCountOfReferenceCallbacks({
      collectionName: 'Notifications',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Notifications', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createNotification, updateFunction as updateNotification };


export const graphqlNotificationTypeDefs = gql`
  input CreateNotificationInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateNotificationInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createNotification(input: CreateNotificationInput!): Notification
    updateNotification(input: UpdateNotificationInput!): Notification
  }
`;
