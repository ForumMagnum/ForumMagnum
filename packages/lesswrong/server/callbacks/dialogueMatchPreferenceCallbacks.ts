import { getCollectionHooks } from "../mutationCallbacks";
import { createMutator, updateMutator } from "../vulcan-lib";

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

getCollectionHooks("DialogueMatchPreferences").createBefore.add(async function GenerateDialogue ( userMatchPreferences, { context, currentUser } ) {
  const { dialogueCheckId } = userMatchPreferences;
  const dialogueCheck = await context.loaders.DialogueChecks.load(dialogueCheckId);

  // This shouldn't ever happen
  if (!dialogueCheck || !currentUser || currentUser._id !== dialogueCheck.userId) {
    console.log("exit early dialogueCheck")
    throw new Error(`Can't find check for dialogue match preferences!`);
  }
  const { userId, targetUserId } = dialogueCheck;
  
  const reciprocalDialogueCheck =  await context.DialogueChecks.findOne({ userId: targetUserId, targetUserId: userId });
  // In theory, this shouldn't happen either
  if (!reciprocalDialogueCheck) {
    console.log("exit early reciprocalDialogueCheck")
    throw new Error(`Can't find reciprocal check for dialogue match preferences!`);
  }

  const reciprocalMatchPreferences = await context.DialogueMatchPreferences.findOne({dialogueCheckId: reciprocalDialogueCheck._id});
  // This can probably cause a race condition if two user submit their match preferences at the same time, where neither of them realize the other is about to exist
  // Should basically never happen, though
  if (!reciprocalMatchPreferences) {
    console.log("exit early reciprocalMatchPreferences")
    return userMatchPreferences;
  }

  const targetUser = await context.loaders.Users.load(targetUserId);
  const title = `${currentUser.displayName} and ${targetUser.displayName}`;
 
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
          data: `<p>${welcomeMessage( userMatchPreferences, reciprocalMatchPreferences )}</p>`
        }
      } as AnyBecauseHard
    },
    validate: false,
    context,
    currentUser
  });

  const generatedDialogueId = result.data._id;
  console.log( "generatedDialogueId", generatedDialogueId)

  void updateMutator({
    collection: context.DialogueMatchPreferences,
    documentId: reciprocalMatchPreferences._id,
    data: { generatedDialogueId },
    context
  });

  userMatchPreferences.generatedDialogueId = generatedDialogueId;

  return userMatchPreferences;
});
