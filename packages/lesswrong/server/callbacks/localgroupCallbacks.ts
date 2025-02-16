import { getCollectionHooks } from '../mutationCallbacks';
import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';
import Users from '../../lib/vulcan-users';


getCollectionHooks("Localgroups").createValidate.add((validationErrors: Array<any>, {document: group}) => {
  if (!group.isOnline && !group.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

getCollectionHooks("Localgroups").updateValidate.add((validationErrors: Array<any>, {oldDocument, newDocument}: {oldDocument: DbLocalgroup, newDocument: DbLocalgroup}) => {
  if (!newDocument.isOnline && !newDocument.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

getCollectionHooks("Localgroups").createAsync.add(async ({document}) => {
  await createNotifications({userIds: document.organizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
})

getCollectionHooks("Localgroups").updateAsync.add(async ({document, oldDocument}: {document: DbLocalgroup, oldDocument: DbLocalgroup}) => {
  // notify new organizers that they have been added to this group
  const newOrganizerIds = difference(document.organizerIds, oldDocument.organizerIds)
  await createNotifications({userIds: newOrganizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
  
  // if this group is being marked as inactive or deleted, remove it from the profile of all associated organizers
  const groupIsBeingHidden = (!oldDocument.inactive && document.inactive) || (!oldDocument.deleted && document.deleted)
  // otherwise, remove this group from the profile of any organizers who have been removed
  const removedOrganizerIds = groupIsBeingHidden ? oldDocument.organizerIds : difference(oldDocument.organizerIds, document.organizerIds)

  if (!removedOrganizerIds || !removedOrganizerIds.length) return
  const removedOrganizers = await Users.find({_id: {$in: removedOrganizerIds}}).fetch()
  
  removedOrganizers.forEach(organizer => {
    if (!organizer.organizerOfGroupIds) return

    const newOrganizerOfGroupIds = difference(organizer.organizerOfGroupIds, [document._id])
    if (organizer.organizerOfGroupIds.length > newOrganizerOfGroupIds.length) {
      void Users.rawUpdateOne(
        {_id: organizer._id},
        {$set: {organizerOfGroupIds: newOrganizerOfGroupIds}}
      )
    }
  })
})
