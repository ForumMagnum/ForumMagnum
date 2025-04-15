
import schema from "@/lib/collections/notifications/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


// TODO: I'm pretty sure we shouldn't actually allow users who own notifications to edit them...
function editCheck(user: DbUser | null, document: DbNotification | null) {
  if (!user || !document) return false;
  return userOwns(user, document)
    ? userCanDo(user, 'notifications.edit.own')
    : userCanDo(user, `notifications.edit.all`)
}

export async function createNotification({ data }: CreateNotificationInput & { data: { emailed?: boolean | null; waitingForBatch?: boolean | null } }, context: ResolverContext) {
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

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Notifications', documentWithId);

  return documentWithId;
}

export async function updateNotification({ selector, data }: { data: UpdateNotificationDataInput | Partial<DbNotification>, selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, Notifications } = context;

  const {
    documentSelector: notificationSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Notifications', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Notifications, notificationSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Notifications', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}


export const updateNotificationGqlMutation = makeGqlUpdateMutation('Notifications', updateNotification, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Notifications', rawResult, context)
});



export const graphqlNotificationTypeDefs = gql`  
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
    updateNotification(selector: SelectorInput!, data: UpdateNotificationDataInput!): NotificationOutput
  }
`;
