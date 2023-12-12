import { userGetDisplayName } from "../../lib/collections/users/helpers";
import { getCollectionHooks } from "../mutationCallbacks";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext, createMutator, updateMutator } from "../vulcan-lib";
import { validatedCalendlyUrl } from "../../components/dialogues/CalendlyIFrame";
import { helperBotId, welcomeMessage } from "../dialogues/dialogueHelperBot";


getCollectionHooks("DialogueMatchPreferences").createValidate.add((validationErrors: Array<any>, {document: preference}: {document: DbDialogueMatchPreference}) => {
  const valid = preference.calendlyLink === null ? true : validatedCalendlyUrl(preference.calendlyLink).valid
  if (!valid)
    throw new Error("Calendly link is not valid");

  return validationErrors;
});

getCollectionHooks("DialogueMatchPreferences").createBefore.add(async function GenerateDialogue ( userMatchPreferences, { context, currentUser } ) {
  const { dialogueCheckId } = userMatchPreferences;
  const dialogueCheck = await context.loaders.DialogueChecks.load(dialogueCheckId);

  // This shouldn't ever happen
  if (!dialogueCheck ?? !currentUser ?? currentUser._id !== dialogueCheck.userId) {
    throw new Error(`Can't find check for dialogue match preferences!`);
  }
  const { userId, targetUserId } = dialogueCheck;
  
  const reciprocalDialogueCheck =  await context.DialogueChecks.findOne({ userId: targetUserId, targetUserId: userId });
  // In theory, this shouldn't happen either
  if (!reciprocalDialogueCheck) {
    throw new Error(`Can't find reciprocal check for dialogue match preferences!`);
  }

  const reciprocalMatchPreferences = await context.DialogueMatchPreferences.findOne({dialogueCheckId: reciprocalDialogueCheck._id, deleted: {$ne: true}});
  // This can probably cause a race condition if two user submit their match preferences at the same time, where neither of them realize the other is about to exist
  // Should basically never happen, though
  if (!reciprocalMatchPreferences) {
    return userMatchPreferences;
  }

  const targetUser = await context.loaders.Users.load(targetUserId);
  const title = `Dialogue match between ${currentUser.displayName} and ${targetUser.displayName}`

  const formDataSourceUser = {
    ...userMatchPreferences,
    userId: userId, 
    displayName: userGetDisplayName(currentUser),
  }
  const formDataTargetUser = {
    ...reciprocalMatchPreferences,
    userId: targetUserId,
    displayName: userGetDisplayName(targetUser),
  }
 
  const result = await createMutator({
    collection: context.Posts,
    document: {
      userId,
      title,
      draft: true,
      collabEditorDialogue: true,
      coauthorStatuses:[{userId: targetUserId, confirmed: true, requested: false}],
      shareWithUsers: [targetUserId],
      sharingSettings: {
        anyoneWithLinkCan: "none",
        explicitlySharedUsersCan: "edit",
      },
      contents: {
        originalContents: {
          type: "ckEditorMarkup",
          data: welcomeMessage(formDataSourceUser, formDataTargetUser)
        }
      } as AnyBecauseHard
    },
    validate: false,
    context,
    currentUser
  });

  const generatedDialogueId = result.data._id;

  // notify both users that Dialogue Helper Bot has messaged them in the new dialogue
  await createNotifications({
    userIds: [userId, targetUserId],
    notificationType: 'newDialogueMessages',
    documentType: 'post',
    documentId: generatedDialogueId,
    extraData: {newMessageAuthorId: helperBotId}
  });

  void updateMutator({
    collection: context.DialogueMatchPreferences,
    documentId: reciprocalMatchPreferences._id,
    data: { generatedDialogueId },
    // Since this is updating a field which only admins are allowed to update, we need to pass in an admin context instead of the actual request's context
    context: createAdminContext(),
    validate: false,
  });

  userMatchPreferences.generatedDialogueId = generatedDialogueId;

  return userMatchPreferences;
});
