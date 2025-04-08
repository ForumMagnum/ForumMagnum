
import schema from "@/lib/collections/notifications/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

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
  createFunction: async ({ data }: CreateNotificationInput & { data: { emailed?: boolean | null; waitingForBatch?: boolean | null } }, context: ResolverContext) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Notifications', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

  updateFunction: async ({ selector, data }: { data: UpdateNotificationDataInput | Partial<DbNotification>, selector: SelectorInput }, context) => {
    const { currentUser, Notifications } = context;

    const {
      documentSelector: notificationSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Notifications', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Notifications, notificationSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'Notifications',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createNotificationGqlMutation = makeGqlCreateMutation('Notifications', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Notifications', rawResult, context)
});

export const updateNotificationGqlMutation = makeGqlUpdateMutation('Notifications', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Notifications', rawResult, context)
});


export { createFunction as createNotification, updateFunction as updateNotification };

export const graphqlNotificationTypeDefs = gql`
  input CreateNotificationDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateNotificationInput {
    data: CreateNotificationDataInput!
  }
  
  input UpdateNotificationDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
