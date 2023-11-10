import { getCollectionHooks } from "../mutationCallbacks";
import { cheerioParse } from "../utils/htmlUtil";
import { createMutator, updateMutator } from "../vulcan-lib";

interface MatchPreferenceFormData extends DbDialogueMatchPreference {
  displayName: string;
}

function getParagraphWithText(text: string) {
  const $ = cheerioParse('<p></p>');
  return $('p').text(text);
}

const welcomeMessage = (formDataSourceUser: MatchPreferenceFormData, formDataTargetUser: MatchPreferenceFormData) => {
  let formatMessage
  let topicMessage 
  let nextAction

  const userName = formDataSourceUser.displayName;
  const targetUserName = formDataTargetUser.displayName;

  const isYesOrMeh = (value: string) => ["Yes", "Meh"].includes(value);

  const formatPreferenceMatch = 
    (isYesOrMeh(formDataSourceUser.syncPreference) && isYesOrMeh(formDataTargetUser.syncPreference)) ||
    (isYesOrMeh(formDataSourceUser.asyncPreference) && isYesOrMeh(formDataTargetUser.asyncPreference));


  formatMessage = `Format preferences: 
    * ${userName} is "${formDataSourceUser.syncPreference}" on sync and "${formDataSourceUser.asyncPreference}" on async. ${formDataSourceUser.formatNotes}
    * ${targetUserName} is "${formDataTargetUser.syncPreference}" on sync and "${formDataTargetUser.asyncPreference}" on async. ${formDataTargetUser.formatNotes}
  `

  const topicsInCommon:string[] = [] //formDataSourceUser.topics.filter(topic => formDataTargetUser.topics.includes(topic));
  const topicMatch = topicsInCommon.length > 0 || formDataSourceUser.topicNotes !== "" || formDataTargetUser.topicNotes !== "";

  if (!topicMatch) {
    topicMessage = `It seems you guys didn't have any preferred topics in common.`
    //   * ${userName} topics: ${formDataSourceUser.topics}
    //   * ${targetUserName} topics: ${formDataTargetUser.topics}
    // `
  } else {
    topicMessage = `
      You were both interested in discussing: ${topicsInCommon.join(", ")}.
    `
  }

  // default
  nextAction = `Our auto-checker couldn't tell if you were compatible or not. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)`

  if (!topicMatch && !formatPreferenceMatch) {
    nextAction = `
      It seems you didn't really overlap on topics or format. That's okay! It's fine to call this a "nice try" and just move on :) 
      (We still created this chat for you in case you wanted to discuss a bit more)
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

  const matchLine = `Helper-bot: Hey ${userName} and ${targetUserName}: you matched on dialogues!`;

  const paragraphContents = [matchLine, topicMessage, formatMessage, nextAction];

  // We have a bunch of string concatenation going on
  // So we set each bit as the text content of its own paragraph
  const $ = cheerioParse("<div></div>");
  paragraphContents.forEach(paragraphContent => {
    const paragraphWithText = getParagraphWithText(paragraphContent);
    $('div').append(paragraphWithText);
  });

  return $('div').html();
}

getCollectionHooks("DialogueMatchPreferences").createBefore.add(async function GenerateDialogue ( userMatchPreferences, { context, currentUser } ) {
  const { dialogueCheckId } = userMatchPreferences;
  const dialogueCheck = await context.loaders.DialogueChecks.load(dialogueCheckId);

  // This shouldn't ever happen
  if (!dialogueCheck || !currentUser || currentUser._id !== dialogueCheck.userId) {
    throw new Error(`Can't find check for dialogue match preferences!`);
  }
  const { userId, targetUserId } = dialogueCheck;
  
  const reciprocalDialogueCheck =  await context.DialogueChecks.findOne({ userId: targetUserId, targetUserId: userId });
  // In theory, this shouldn't happen either
  if (!reciprocalDialogueCheck) {
    throw new Error(`Can't find reciprocal check for dialogue match preferences!`);
  }

  const reciprocalMatchPreferences = await context.DialogueMatchPreferences.findOne({dialogueCheckId: reciprocalDialogueCheck._id});
  // This can probably cause a race condition if two user submit their match preferences at the same time, where neither of them realize the other is about to exist
  // Should basically never happen, though
  if (!reciprocalMatchPreferences) {
    return userMatchPreferences;
  }

  const targetUser = await context.loaders.Users.load(targetUserId);
  const title = `${currentUser.displayName} and ${targetUser.displayName}`;

  const formDataUser1 = {
    ...userMatchPreferences,
    displayName: currentUser.displayName,
  }
  const formDataUser2 = {
    ...reciprocalMatchPreferences,
    displayName: targetUser.displayName,
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
          data: welcomeMessage( formDataUser1, formDataUser2 )
        }
      } as AnyBecauseHard
    },
    validate: false,
    context,
    currentUser
  });

  const generatedDialogueId = result.data._id;

  void updateMutator({
    collection: context.DialogueMatchPreferences,
    documentId: reciprocalMatchPreferences._id,
    data: { generatedDialogueId },
    context
  });

  userMatchPreferences.generatedDialogueId = generatedDialogueId;

  return userMatchPreferences;
});
