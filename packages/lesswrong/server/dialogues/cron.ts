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
    console.log("Running dialogue helper bot cron job...")


    const staleDialogues = await context.repos.posts.getStaleDialogues()
    // filter for compatible (format and topic match)
    const compatibleDialogues = await Promise.all(staleDialogues.filter(async (dialogue) => {
      const dialogueMatchPreferences = await DialogueMatchPreferences.find({
        generatedDialogueId: dialogue._id,
        deleted: false
      }).fetch();
    
      return checkCompatible(dialogueMatchPreferences); // todo: debug
    }));
    
    console.log("Compatible dialogues: ", compatibleDialogues.length, " out of ", staleDialogues.length, " stale dialogues")

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

         // if (previousNotification) { //todo revert back to "not"
            const authors = await Users.find({_id: {$in: dialogueAuthorIds}}).fetch();
            const displayNames = authors.filter(author => author._id === userId).map(author => author.displayName);
  
            const last = displayNames.length > 0 ? displayNames.pop() : "";
            const dialogueAuthorNamesString = displayNames.join(', ') + (displayNames.length > 0 ? ', and ' : '') + last;
            console.log("names string: ", dialogueAuthorNamesString)
  
            // void createNotification({
            //   userId,
            //   notificationType: "sendDialogueHelperBotPing",
            //   documentType: null,
            //   documentId: null,
            //   extraData: {userId, targetUserDisplayName: dialogueAuthorNamesString, dialogueId: dialogue._id }, // userId passed for the AB test
            //   context,
            // })
     //     }
      })

        // console.log("skimming dialogue: ", dialogue.title, dialogue._id)
        // if (dialogue?.contents?.originalContents?.data) {
        //   console.log("Found data.")
        //   const previousHtml = dialogue.contents.originalContents.data
        //   const newMessageHtml = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", `May joy be with you all.`)
        //   const newHtml = appendDialogueMessage( previousHtml, newMessageHtml );
        //   if (["sZwqk7wrLjmbnzCLC", "RgHkbqMo69zBZpSGp", "rbM58eXKkMLRHngKi", "APoWyrJJTCoP8Wj6T" ].includes(dialogue._id)) {
        //     console.log("trying to update... ", dialogue.title, dialogue._id)
        //     // const response = await updateMutator({
        //     //   collection: Posts,
        //     //   documentId: dialogue._id,
        //     //   data: { 
        //     //     contents: {
        //     //       originalContents: {
        //     //         type: "ckEditorMarkup",
        //     //         data: newMessageHtml
        //     //       }
        //     //     } 
        //     //   },
        //     //   context: adminContext,
        //     //   validate: false, 
        //     //   currentUser: adminContext.currentUser
        //     // });
        //     console.log("response: ", response)
            
        //   }
        // }
      }))
    }

    


    // if necessary, send a notification
    
  }
});
