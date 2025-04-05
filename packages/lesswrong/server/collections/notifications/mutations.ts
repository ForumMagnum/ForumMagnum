
import schema from "@/lib/collections/notifications/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

function newCheck(user: DbUser | null, document: DbNotification | null) {
  if (!user || !document) return false;
  return userOwns(user, document)
    ? userCanDo(user, 'notifications.new.own')
    : userCanDo(user, `notifications.new.all`)
}

// TODO: I'm pretty sure we shouldn't actually allow users who own notifications to edit them...
function editCheck(user: DbUser | null, document: DbNotification | null) {
  if (!user || !document) return false;
  return userOwns(user, document)
    ? userCanDo(user, 'notifications.edit.own')
    : userCanDo(user, `notifications.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Notifications', {
  createFunction: async ({ data }: CreateNotificationInput & { data: { emailed?: boolean | null; waitingForBatch?: boolean | null } }, context: ResolverContext, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Notifications', {
      context,
      data,
      schema,
      skipValidation,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { data: UpdateNotificationDataInput | Partial<DbNotification>, selector: SelectorInput }, context, skipValidation?: boolean) => {
    const { currentUser, Notifications } = context;

    const {
      documentSelector: notificationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Notifications', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Notifications', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Notifications', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Notifications', rawResult, context)
});


export { createFunction as createNotification, updateFunction as updateNotification };
export { wrappedCreateFunction as createNotificationMutation, wrappedUpdateFunction as updateNotificationMutation };

export const graphqlNotificationTypeDefs = gql`
  input CreateNotificationDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateNotificationInput {
    data: CreateNotificationDataInput!
  }
  
  input UpdateNotificationDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateNotificationInput {
    selector: SelectorInput!
    data: UpdateNotificationDataInput!
  }
  
  type NotificationOutput {
    data: Notification
  }

  extend type Mutation {
    createNotification(data: CreateNotificationDataInput!): NotificationOutput
    updateNotification(selector: SelectorInput!, data: UpdateNotificationDataInput!): NotificationOutput
  }
`;
