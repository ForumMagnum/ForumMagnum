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

type TopicMatch = "match" | "noMatch" | "uncertain";

const welcomeMessage = (formDataSourceUser: MatchPreferenceFormData, formDataTargetUser: MatchPreferenceFormData) => {
  const userName = formDataSourceUser.displayName;
  const targetUserName = formDataTargetUser.displayName;

  const isYesOrMeh = (value: string) => ["Yes", "Meh"].includes(value);

  let matchLine
  let formatMessage
  let nextAction

  matchLine = `<strong>Dialogue-bot:</strong> Hey ${userName} and ${targetUserName}, you were potentially interested in a dialogue... let's see if there's something here.`;

  const formatPreferenceMatch = 
    (isYesOrMeh(formDataSourceUser.syncPreference) && isYesOrMeh(formDataTargetUser.syncPreference)) ||
    (isYesOrMeh(formDataSourceUser.asyncPreference) && isYesOrMeh(formDataTargetUser.asyncPreference));

  formatMessage = `
    <table>
      <tr>
        <th></th>
        <th>Sync (find a time)</th>
        <th>Async</th>
      </tr>
      <tr>
        <td class="username" style="font-weight: normal;"></td>
        <td style="font-weight: normal;">${formDataSourceUser.syncPreference}</td>
        <td style="font-weight: normal;">${formDataSourceUser.asyncPreference}</td>
      </tr>
      <tr>
        <td class="target-username" style="font-weight: normal;"></td>
        <td style="font-weight: normal;">${formDataTargetUser.syncPreference}</td>
        <td style="font-weight: normal;">${formDataTargetUser.asyncPreference}</td>
      </tr>
    </table>
  `
  const userFormatNotesDangerous = `${userName}: "` + formDataSourceUser.formatNotes + `"`
  const targetUserFormatNotesDangerous = `${targetUserName}: "` + formDataTargetUser.formatNotes + `"`

  let topicMatch: TopicMatch = "uncertain" as TopicMatch; // Haven't build the other functionality for now. TODO! 
  let topicMessage: string;

  switch (topicMatch) {
    case 'match':
      topicMessage = `<p>You had some shared interests!</p><p>Topic notes:</p>`;
      break;
    case 'noMatch':
      topicMessage = `<p>It seems you guys didn't have any preferred topics in common.</p><p>Topic notes:</p>`;
      break;
    case 'uncertain':
      topicMessage = `<p><strong>Topic notes</strong></p>`;
      break;
  }

  const userTopicNotesDangerous = `${userName}: "` + formDataSourceUser.topicNotes + `"`
  const targetUserTopicNotesDangerous = `${targetUserName}: "` + formDataTargetUser.topicNotes + `"`

  // default
  nextAction = `<strong>Suggestions:</strong> Our auto-checker couldn't tell if you were compatible or not. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)`

  if (formatPreferenceMatch && topicMatch === "uncertain") {
    nextAction = `
      <strong>Suggestions:</strong> Your preferences overlapped on format, but our auto-checker couldn't tell if you had topics in common. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)
    `
  } 
  if (!formatPreferenceMatch && topicMatch === "uncertain") {
    nextAction = `
      <strong>Suggestions:</strong> It seems you have different format preferences. So a dialogue might not be the right solution here. That's okay! It's fine to call this a "nice try" and just move on :)
      (We still created this chat for you in case that's not right and you wanted to discuss a bit more)
    `
  } 

  // TODO: handle different cases
  // if (!topicMatch && formatPreferenceMatch) {
  //   nextAction = `
  //     It seems you didn't find a topic, but do overlap on format. Feel free to come up with some more topic ideas! If you can't find any, that's okay! It's fine to call this a "nice try" and just move on :) 
  //   `
  // } 
  // if (topicsInCommon && formatPreferenceMatch) {
  //   nextAction = `
  //     It seems you've got overlap on both topic and format! :) 
  //   `
  // }
  // if (topicsInCommon && !formatPreferenceMatch) {
  //   nextAction = `
  //     It seems you've got topics in common, but have different preferences on format. So a dialogue might not be the right solution here. That's okay! We still made this chat if you wanna hash it out more :) 
  //   `
  // }

  const paragraphContents = [matchLine, topicMessage, formatMessage, nextAction];

  // We have a bunch of string concatenation going on
  // So we set each bit as the text content of its own paragraph
  const $ = cheerioParse("<div></div>");

  $('div').append( cheerioParse(matchLine).root() )

  $('div').append(formatMessage)
  $('.username').text(userName)
  $('.target-username').text(targetUserName)

  $('div').append( getParagraphWithText(userFormatNotesDangerous) )
  $('div').append( getParagraphWithText(targetUserFormatNotesDangerous) )
  $('div').append( cheerioParse(topicMessage).root() )
  $('div').append( getParagraphWithText(userTopicNotesDangerous) )
  $('div').append( getParagraphWithText(targetUserTopicNotesDangerous) )
  $('div').append( cheerioParse(nextAction).root() )

  // paragraphContents.forEach(paragraphContent => {
  //   const paragraphWithText = getParagraphWithText(paragraphContent);
  //   $('div').append(paragraphWithText);
  // });

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
  const title = `Checking if any topic / format overlap...` // ${currentUser.displayName} and ${targetUser.displayName}`;

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
