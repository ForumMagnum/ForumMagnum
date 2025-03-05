import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';

// createValidate
function localgroupCreateValidate(validationErrors: CallbackValidationErrors, {document: group}: CreateCallbackProperties<'Localgroups'>) {
  if (!group.isOnline && !group.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
}

// createAsync
async function localgroupCreateAsync({document}: AfterCreateCallbackProperties<'Localgroups'>) {
  await createNotifications({userIds: document.organizerIds, notificationType: "newGroupOrganizer", documentType: "localgroup", documentId: document._id})
}

// updateValidate
function localgroupUpdateValidate(validationErrors: CallbackValidationErrors, {oldDocument, newDocument}: UpdateCallbackProperties<'Localgroups'>) {
  if (!newDocument.isOnline && !newDocument.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
}

// updateAsync
async function localgroupUpdateAsync({ document, oldDocument, context }: UpdateCallbackProperties<'Localgroups'>) {
  const { Users } = context;

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
}

getCollectionHooks('Localgroups').createValidate.add(localgroupCreateValidate);
getCollectionHooks('Localgroups').createAsync.add(localgroupCreateAsync);
getCollectionHooks('Localgroups').updateValidate.add(localgroupUpdateValidate);
getCollectionHooks('Localgroups').updateAsync.add(localgroupUpdateAsync);
