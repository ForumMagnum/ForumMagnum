import { getCollectionHooks } from '../mutationCallbacks';
import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';
import Users from '../../lib/vulcan-users';


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
  // notify new organizers that they have been added to this group
  const newOrganizerIds = difference(document.organizerIds, oldDocument.organizerIds)
  await createNotifications({userIds: newOrganizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
  
  // remove this group from the profile of any organizers who have been removed
  const removedOrganizerIds = difference(oldDocument.organizerIds, document.organizerIds)
  const removedOrganizers = await Users.find({_id: {$in: removedOrganizerIds}}).fetch()
  
  removedOrganizers.forEach(organizer => {
    const newOrganizerOfGroupIds = difference(organizer.organizerOfGroupIds, [document._id])
    if (organizer.organizerOfGroupIds.length > newOrganizerOfGroupIds.length) {
      Users.rawUpdateOne(
        {_id: organizer._id},
        {$set: {organizerOfGroupIds: newOrganizerOfGroupIds}}
      )
    }
  })
})
