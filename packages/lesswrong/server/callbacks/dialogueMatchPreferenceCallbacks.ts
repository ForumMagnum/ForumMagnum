import { getCollectionHooks } from "../mutationCallbacks";
import { cheerioParse } from "../utils/htmlUtil";
import { createMutator, updateMutator } from "../vulcan-lib";

interface MatchPreferenceFormData extends DbDialogueMatchPreference {
  displayName: string;
  userId: string
}

function getParagraphWithText(text: string) {
  const $ = cheerioParse('<p></p>');
  return $('p').text(text);
}

type TopicMatch = "match" | "noMatch" | "uncertain";

function convertTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toUTCString();
}

const getDialogueMessageHTML = (userId:string, displayName:string, order:string, content:string ) => {

  const time = convertTimestamp(Date.now())
  const message_id = `${userId}-${time}`

  const html = 
    `<section class="dialogue-message ContentStyles-debateResponseBody" message-id="${message_id}" user-id="${userId}" display-name="${displayName}" submitted-date="${time}" user-order="${order}">
      <section class="dialogue-message-header CommentUserName-author UsersNameDisplay-noColor"></section>
      <div>
        ${content}
      </div>
    </section>`

  return html
}

const getFormAsHtml = (formData: MatchPreferenceFormData) => {
  const html = `
    <p>${formData.topicNotes}</p>
  `
  return html
}

const helperBotDisplayName = "Dialogue Helper Bot"
const helperBotId = "edmzLyzymdoSuXnym"

const welcomeMessage = (formDataSourceUser: MatchPreferenceFormData, formDataTargetUser: MatchPreferenceFormData) => {
  const userName = formDataSourceUser.displayName;
  const userId = formDataSourceUser.userId;
  const targetUserName = formDataTargetUser.displayName;
  const targetUserId = formDataTargetUser.userId;
  

  const introMessageContent = `
    <p>Hey ${userName} and ${targetUserName}, you were potentially interested in a dialogue!</p>
    <p>Here are your form replies on format:</p>
    <ul>
      <li><i>Sync:</i> find a 1-3h time to sit down and dialogue</li>
      <li><i>Async: </i>like a letter exchange over time. Suggested effort: at least 2 longer replies each before publishing</li>
    </ul>
    <figure class="table">
      <table>
        <tbody>
          <tr>
            <td>&nbsp;
            </td>
            <td><strong>Sync</strong></td>
            <td><strong>Async</strong></td>
            <td>Notes</td>
          </tr>
          <tr>
            <td><i>${userName}</i></td>
            <td>${formDataSourceUser.syncPreference}</td>
            <td>${formDataSourceUser.asyncPreference}</td>
            <td>${formDataSourceUser.formatNotes}</td>
          </tr>
          <tr>
            <td><i>${targetUserName}</i></td>
            <td>${formDataTargetUser.syncPreference}</td>
            <td>${formDataTargetUser.asyncPreference}</td>
            <td>${formDataTargetUser.formatNotes}</td>
          </tr>
        </tbody>
      </table>
    </figure>
    <p>And here's what you said on topics:</p>
  `;

  const isYesOrMeh = (value: string) => ["Yes", "Meh"].includes(value);

  const formatPreferenceMatch = 
    (isYesOrMeh(formDataSourceUser.syncPreference) && isYesOrMeh(formDataTargetUser.syncPreference)) ||
    (isYesOrMeh(formDataSourceUser.asyncPreference) && isYesOrMeh(formDataTargetUser.asyncPreference));


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
      topicMessage = `<p><strong>Topic</strong></p>`;
      break;
  }

  const userContent = getFormAsHtml(formDataSourceUser)
  const targetUserContent = getFormAsHtml(formDataTargetUser)

  let nextAction = `<p>My auto-checker couldn't tell if you were compatible or not. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)</p>`

  if (formatPreferenceMatch && topicMatch === "uncertain") {
    nextAction = `
      <p>It seems your preferences overlapped on format, but our auto-checker couldn't tell if you had topics in common. Feel free to chat to figure it out. And if it doesn't work it's totally okay to just call this a "good try" and then move on :)</p>
    `
  } 
  if (!formatPreferenceMatch && topicMatch === "uncertain") {
    nextAction = `
      <p>It seems you have different format preferences. So a dialogue might not be the right solution here.</p> 
      <p>That's okay! It's fine to call this a "nice try" and just move on :)
      (We still created this chat for you in case that's not right and you wanted to discuss a bit more)</p>
    `
  } 

  const introMessage = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", introMessageContent);
  const userMessage = getDialogueMessageHTML(userId, userName, "2", userContent);
  const targetUserMessage = getDialogueMessageHTML(targetUserId, targetUserName, "3", targetUserContent);
  const nextActionMessage = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", nextAction); 

  const message = `<div>${introMessage}${userMessage}${targetUserMessage}${nextActionMessage}</div>`

  return message
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
    userId: userId, 
    displayName: currentUser.displayName,
  }
  const formDataUser2 = {
    ...reciprocalMatchPreferences,
    displayName: targetUser.displayName,
    userId: targetUserId,
  }
 
  const result = await createMutator({
    collection: context.Posts,
    document: {
      userId,
      title,
      draft: true,
      collabEditorDialogue: true,
      coauthorStatuses:[{userId: targetUserId, confirmed: true, requested: false}, {userId: helperBotId, confirmed: true, requested: false}],
      shareWithUsers: [targetUserId],
      sharingSettings: {
        anyoneWithLinkCan: "none",
        explicitlySharedUsersCan: "edit",
      },
      contents: {
        originalContents: {
          type: "ckEditorMarkup",
          data: welcomeMessage(formDataUser1, formDataUser2)
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
