import { getCollectionHooks } from "../mutationCallbacks";
import { cheerioParse } from "../utils/htmlUtil";
import { createAdminContext, createMutator, updateMutator } from "../vulcan-lib";

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
      <div class="dialogue-message-content">
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
  

  function getUserTopics (formData: MatchPreferenceFormData) {
    return formData.topicPreferences
      .filter(({ text, preference, commentSourceId }) => preference === "Yes")
      .map(({ text }) => text);
  }

  const sourceUserYesTopics = getUserTopics(formDataSourceUser);
  const targetUserYesTopics = getUserTopics(formDataTargetUser);

  const sharedTopics = sourceUserYesTopics.filter(topic => targetUserYesTopics.includes(topic));
  const sourceUserTopics = sourceUserYesTopics.filter(topic => !targetUserYesTopics.includes(topic));
  const targetUserTopics = targetUserYesTopics.filter(topic => !sourceUserYesTopics.includes(topic));

  const topicMessageContent = `
  <p>You both wanted a dialogue! Some topics you suggested:</p>
  <ul>
    ${sharedTopics.map(topic => `<li>${topic} <strong>(Both!)</strong></li>`).join('')}
    ${sourceUserTopics.map(topic => `<li>${topic} <strong>(${userName})</strong></li>`).join('')}
    ${targetUserTopics.map(topic => `<li>${topic} <strong>(${targetUserName})<strong></li>`).join('')}
  </ul>
  `

  const formatPreferenceContent =
    `
    <p>Here is what you said about your format preferences:</p>
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
  `;

  const isYesOrMeh = (value: string) => ["Yes", "Meh"].includes(value);

  const formatPreferenceMatch = 
    (isYesOrMeh(formDataSourceUser.syncPreference) && isYesOrMeh(formDataTargetUser.syncPreference)) ||
    (isYesOrMeh(formDataSourceUser.asyncPreference) && isYesOrMeh(formDataTargetUser.asyncPreference));

  let nextAction = `<p> Feel free to coordinate timing and topic in this chat.</p>`

  if (!formatPreferenceMatch) {
    nextAction =
    `It seems you have different format preferences, so a dialogue might not make sense—
    but if either of you wants to give it a try anyway, you can always send a message in this chat.`
  }

  // overall messages
  const topicMessage = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", topicMessageContent);
  const formatMessage = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", formatPreferenceContent);
  const nextActionMessage = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", nextAction); 

  // // user content
  // const userContent = getFormAsHtml(formDataSourceUser)
  // const targetUserContent = getFormAsHtml(formDataTargetUser)

  // const userMessage = getDialogueMessageHTML(userId, userName, "2", userContent);
  // const targetUserMessage = getDialogueMessageHTML(targetUserId, targetUserName, "3", targetUserContent);
  
  const message = `<div>${topicMessage}${formatMessage}${nextActionMessage}</div>`

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
    // Since this is updating a field which only admins are allowed to update, we need to pass in an admin context instead of the actual request's context
    context: createAdminContext()
  });

  userMatchPreferences.generatedDialogueId = generatedDialogueId;

  return userMatchPreferences;
});
