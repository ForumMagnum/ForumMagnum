import type { AfterCreateCallbackProperties, UpdateCallbackProperties } from '../mutationCallbacks';
import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';
import { backgroundTask } from '../utils/backgroundTask';

export function validateGroupIsOnlineOrHasLocation(group: CreateLocalgroupDataInput | DbLocalgroup) {
  if (!group.isOnline && !group.location)
    throw new Error("Location is required for local groups");
}

export async function createGroupNotifications({document}: AfterCreateCallbackProperties<'Localgroups'>) {
  await createNotifications({userIds: document.organizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
}

export async function handleOrganizerUpdates({ newDocument, oldDocument, context }: UpdateCallbackProperties<'Localgroups'>) {
  const { Users } = context;

  // notify new organizers that they have been added to this group
  const newOrganizerIds = difference(newDocument.organizerIds, oldDocument.organizerIds)
  await createNotifications({userIds: newOrganizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: newDocument._id})
  
  // if this group is being marked as inactive or deleted, remove it from the profile of all associated organizers
  const groupIsBeingHidden = (!oldDocument.inactive && newDocument.inactive) || (!oldDocument.deleted && newDocument.deleted)
  // otherwise, remove this group from the profile of any organizers who have been removed
  const removedOrganizerIds = groupIsBeingHidden ? oldDocument.organizerIds : difference(oldDocument.organizerIds, newDocument.organizerIds)

  if (!removedOrganizerIds || !removedOrganizerIds.length) return
  const removedOrganizers = await Users.find({_id: {$in: removedOrganizerIds}}).fetch()
  
  removedOrganizers.forEach(organizer => {
    if (!organizer.organizerOfGroupIds) return

    const newOrganizerOfGroupIds = difference(organizer.organizerOfGroupIds, [newDocument._id])
    if (organizer.organizerOfGroupIds.length > newOrganizerOfGroupIds.length) {
      backgroundTask(Users.rawUpdateOne(
        {_id: organizer._id},
        {$set: {organizerOfGroupIds: newOrganizerOfGroupIds}}
      ))
    }
  })
}
