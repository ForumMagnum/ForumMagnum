import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import {Posts} from "../../lib/collections/posts";
import { getCollectionHooks } from "../mutationCallbacks";
import { createMutator } from "../vulcan-lib";

const welcomeMessage = (formDataUser1: DbDialogueMatchPreference, formDataUser2: DbDialogueMatchPreference) => {
  let formatMessage
  let topicMessage 
  let nextAction

  const dummyData1 = {
    userId: "Jacob",
    topics: ["AI Alignment", "Rationality", "EA", "inner alignment"],
    topicNotes: "I'm interested in chatting about AI Alignment, Rationality and EA",
    formatSync: "Yes",
    formatAsync: "Meh",
    formatNotes: "",
  }
  const dummyData2 = {
    userId: "Wentworth",
    topics: ["Animals", "EA", "inner alignment"],
    topicNotes: "I'm interested in these things but open to other things",
    formatSync: "No",
    formatAsync: "Yes",
    formatNotes: ""
  }

  const isYesOrMeh = (value: string) => ["Yes", "Meh"].includes(value);

  const formatPreferenceMatch = 
    (isYesOrMeh(dummyData1.formatSync) && isYesOrMeh(dummyData2.formatSync)) ||
    (isYesOrMeh(dummyData1.formatAsync) && isYesOrMeh(dummyData2.formatAsync));

  const hasFormatNotes = (dummyData1.formatNotes !== "" || dummyData2.formatNotes !== "");

  formatMessage = `Format preferences: 
    * ${dummyData1.userId} is "${dummyData1.formatSync}" on sync and "${dummyData1.formatAsync}" on async. ${dummyData1.formatNotes}
    * ${dummyData2.userId} is "${dummyData2.formatSync}" on sync and "${dummyData2.formatAsync}" on async. ${dummyData2.formatNotes}
  `

  const topicsInCommon = dummyData1.topics.filter(topic => dummyData2.topics.includes(topic));
  const topicMatch = topicsInCommon.length > 0 || dummyData1.topicNotes !== "" || dummyData2.topicNotes !== "";

  if (!topicMatch) {
    topicMessage = `It seems you guys didn't have any preferred topics in common.
      * ${dummyData1.userId} topics: ${dummyData1.topics}
      * ${dummyData2.userId} topics: ${dummyData2.topics}
      That's okay! We still created this dialogue for you in case you wanted to come up with some more together. Though if you can't find anything that's alright, feel free to call it a good try and move on :)
    `
  } else {
    topicMessage = `
      You were both interested in discussing: ${topicsInCommon.join(", ")}.\n
    `
  }

  // default
  nextAction = `Our auto-checker couldn't tell if you were compatible or not. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)`

  if (!topicMatch && !formatPreferenceMatch) {
    nextAction = `
      It seems you didn't really overlap on topics or format. That's okay! It's fine to call this a "nice try" and just move on :) 
      (We still create this chat for you in case you wanted to discuss a bit more)
    `
  } 
  if (!topicMatch && formatPreferenceMatch) {
    nextAction = `
      It seems you didn't find a topic, but do overlap on format. Feel free to come up with some more topic ideas! If you can't find any, that's okay! It's fine to call this a "nice try" and just move on :) 
    `
  } 
  if (topicsInCommon && formatPreferenceMatch) {
    nextAction = `
      It seems you've got overlap on both topic and format! :) 
    `
  }
  if (topicsInCommon && !formatPreferenceMatch) {
    nextAction = `
      It seems you've got topics in common, but have different preferences on format. So a dialogue might not be the right solution here. That's okay! We still made this chat if you wanna hash it out more :) 
    `
  }

  const message = `
    Hey ${dummyData1.userId} and ${dummyData2.userId}: you matched on dialogues!`
    + topicMessage 
    + formatMessage
    + nextAction
  
  return message
}

getCollectionHooks("DialogueMatchPreferences").createBefore.add(async function GenerateDialogue ( userMatchPreferences, { context } ) {
  const { dialogueCheckId } = userMatchPreferences;
  const dialogueCheck = await context.loaders.DialogueChecks.load(dialogueCheckId);
  if (!dialogueCheck) return;
  const { userId, targetUserId } = dialogueCheck;
  
  const reciprocalDialogueCheck =  await context.DialogueChecks.findOne({userdId: targetUserId, targetUserId: userId, checked: true});
  if (!reciprocalDialogueCheck) return;
  const reciprocalMatchPreferences = await context.DialogueMatchPreferences.findOne({dialogueCheckId: reciprocalDialogueCheck._id});
  if (!reciprocalMatchPreferences) return;
  const title = `Dialogue between ${userId} and ${targetUserId}`;
  const participants = [userId, targetUserId];
 
  const result = await createMutator({
    collection: Posts,
    document: {
      title,
      draft: true,
      collabEditorDialogue: true,
      coauthorStatuses: participants.map(userId => ({userId, confirmed: true, requested: false})),
      shareWithUsers: participants,
      sharingSettings: {
        anyoneWithLinkCan: "none",
        explicitlySharedUsersCan: "edit",
      },
      contents: {
        originalContents: {
          type: "ckEditorMarkup",
          data: `<p>${welcomeMessage( userMatchPreferences, reciprocalMatchPreferences )}</p>`
        }
      } as AnyBecauseHard
    },
    validate: false,
  });


  userMatchPreferences.generatedDialogueId = result.data._id;
  return userMatchPreferences;
});
