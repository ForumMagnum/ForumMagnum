import { getCollectionHooks } from '../mutationCallbacks';
import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';


getCollectionHooks("Localgroups").createValidate.add((validationErrors: Array<any>, {document: group}: {document: DbLocalgroup}) => {
  if (!group.isOnline && !group.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

getCollectionHooks("Localgroups").updateValidate.add((validationErrors: Array<any>, {oldDocument, newDocument}: {oldDocument: DbLocalgroup, newDocument: DbLocalgroup}) => {
  if (!newDocument.isOnline && !newDocument.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

getCollectionHooks("Localgroups").createAsync.add(async ({document}: {document: DbLocalgroup}) => {
  await createNotifications({userIds: document.organizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
})

getCollectionHooks("Localgroups").updateAsync.add(async ({document, oldDocument}: {document: DbLocalgroup, oldDocument: DbLocalgroup}) => {
  const newOrganizerIds = difference(document.organizerIds, oldDocument.organizerIds)
  await createNotifications({userIds: newOrganizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
})
