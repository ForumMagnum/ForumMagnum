import { addCronJob } from "../cronUtil";
import { createNotification } from "../notificationCallbacksHelpers";
import { createAdminContext, updateMutator } from "../vulcan-lib";
import Users from '../../lib/collections/users/collection';
import Notifications from '../../lib/collections/notifications/collection';
import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection";
import { getUserTopics, getSyncAsyncPreferences, getPreferenceMatches } from "./dialogueHelperBot";

addCronJob({
  name: 'notifyUsersOfNewDialogueChecks',
  interval: 'every 1 hour',
  async job() {
    const context = createAdminContext();
    const usersWithNewChecks = await context.repos.users.getUsersWithNewDialogueChecks()
    usersWithNewChecks.forEach(user => {
      void createNotification({
        userId: user._id,
        notificationType: "newDialogueChecks",
        documentType: null,
        documentId: null,
        extraData: {userId: user._id}, // passed for the AB test
        context,
      })
    })
  }
});

const checkCompatible = (preferences:DbDialogueMatchPreference[]) => {
  if (preferences.length >= 2) {

    // Topic
    const sourceUserYesTopics = getUserTopics(preferences[0]);
    const targetUserYesTopics = getUserTopics(preferences[1]);
    const sharedTopics = sourceUserYesTopics.filter(topic => targetUserYesTopics.includes(topic));

    // Format 
    const { sync: userSync, async: userAsync } = getSyncAsyncPreferences(preferences[0]);
    const { sync: targetUserSync, async: targetUserAsync } = getSyncAsyncPreferences(preferences[1]);
    const { formatPreferenceMatch } = getPreferenceMatches(
      { sync: userSync, async: userAsync },
      { sync: targetUserSync, async: targetUserAsync }
    );

    if (sharedTopics.length > 0 && formatPreferenceMatch) {
      return true
    } 
  } 
  return false
}

addCronJob({
  name: 'sendDialogueHelperBotPing',
  interval: 'every 30 seconds', // `every 12 hours`,
  async job() {
    const context = createAdminContext();

    const staleDialogues = await context.repos.posts.getStaleDialogues()
    // filter for compatible (format and topic match)
    const compatibleDialogues = [];
    for (const dialogue of staleDialogues) {
      const dialogueMatchPreferences = await DialogueMatchPreferences.find({
        generatedDialogueId: dialogue._id,
        deleted: false
      }).fetch();

      const isCompatible = checkCompatible(dialogueMatchPreferences); // todo: debug
      if (isCompatible) {
        compatibleDialogues.push(dialogue);
      }
    }

    if (compatibleDialogues.length > 0) {
      void Promise.all(compatibleDialogues.map(async dialogue => {
        // Get all users who are either the author or coauthors on the dialogue
        const dialogueAuthorIds = [dialogue.userId, ...(dialogue.coauthorStatuses?.filter(c => c.confirmed).map(c => c.userId) || [])]
        dialogueAuthorIds.forEach(async (userId) => {
          // check that they haven't already received a reminder notification for this dialogue
          const previousNotification = await Notifications.findOne({
            "extraData.dialogueId": dialogue._id,
            userId,
            type: "sendDialogueHelperBotPing",
          })

        if (!previousNotification) { 
            const authors = await Users.find({_id: {$in: dialogueAuthorIds}}).fetch();
            const displayNames = authors.filter(author => author._id !== userId).map(author => author.displayName);
  
            const last = displayNames.length > 0 ? displayNames.pop() : "";
            const dialogueAuthorNamesString = displayNames.join(', ') + (displayNames.length > 0 ? ', and ' : '') + last;
  
            void createNotification({
              userId,
              notificationType: "sendDialogueHelperBotPing",
              documentType: null,
              documentId: null,
              extraData: {userId, targetUserDisplayName: dialogueAuthorNamesString, dialogueId: dialogue._id }, // userId passed for the AB test
              context,
            })
          }
        })
      }))
    }
  }
})    
