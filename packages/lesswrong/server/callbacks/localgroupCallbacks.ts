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

getCollectionHooks("Localgroups").updateAfter.add(async (newDoc: DbLocalgroup, {oldDocument}: {oldDocument: DbLocalgroup}) => {
  const newOrganizerIds = difference(newDoc.organizerIds, oldDocument.organizerIds)
  await createNotifications({userIds: newOrganizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: newDoc._id})
  return newDoc
})
