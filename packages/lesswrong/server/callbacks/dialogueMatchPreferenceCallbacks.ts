import { getCollectionHooks } from "../mutationCallbacks";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext, createMutator, updateMutator } from "../vulcan-lib";

interface MatchPreferenceFormData extends DbDialogueMatchPreference {
  displayName: string;
  userId: string
}

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

const helperBotDisplayName = "Dialogue Helper Bot"
const helperBotId = "jHkqasDqh8HHLen6z"

const welcomeMessage = (formDataSourceUser: MatchPreferenceFormData, formDataTargetUser: MatchPreferenceFormData) => {
  const userName = formDataSourceUser.displayName;
  const targetUserName = formDataTargetUser.displayName;

  function getUserTopics (formData: MatchPreferenceFormData) {
    return formData.topicPreferences
      .filter(({ preference }) => preference === "Yes")
      .map(({ text }) => text);
  }

  const sourceUserYesTopics = getUserTopics(formDataSourceUser);
  const targetUserYesTopics = getUserTopics(formDataTargetUser);

  const sharedTopics = sourceUserYesTopics.filter(topic => targetUserYesTopics.includes(topic));
  const sourceUserTopics = sourceUserYesTopics.filter(topic => !targetUserYesTopics.includes(topic));
  const targetUserTopics = targetUserYesTopics.filter(topic => !sourceUserYesTopics.includes(topic));

  let topicMessageContent = `
    <table style="border-color: hsl(0, 0%, 100%); border-style: solid;">
      <thead>
        <tr>
          <th style="border-color: hsl(0, 0%, 100%); border-style: solid; text-align: center;" colspan="2">Possible Topics</th>
        </tr>
      </thead>
      <tbody>
        ${sharedTopics.map(topic => `
            <tr>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: center; width: 150px;"><strong>Both checked!</strong></td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: left;">${topic}</td>
            </tr>
          `).join('')}
        ${sourceUserTopics.map(topic => `
          <tr>
          <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: center; width: 150px;">${userName} (not yet seen by ${targetUserName})</td>
          <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: left;">${topic}</td>
          </tr>
        `).join('')}
        ${targetUserTopics.map(topic => `
          <tr>
          <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: center; width: 150px;">${targetUserName}</td>
          <td style="border-color: hsl(0, 0%, 100%); border-style: solid; height: 70px; text-align: left;">${topic}</td>
          </tr>
        `).join('')}
    </tbody>
    </table>
  `

  function switchMehForOkay(preference: string): string {
    return preference === "Meh" ? "Okay" : preference;
  }
  
  // Ugly solution for now since we had the database entry read "meh" but the client form entry read "okay"
  const userSync = switchMehForOkay(formDataSourceUser.syncPreference);
  const userAsync = switchMehForOkay(formDataSourceUser.asyncPreference);
  const targetUserSync = switchMehForOkay(formDataTargetUser.syncPreference);
  const targetUserAsync = switchMehForOkay(formDataTargetUser.asyncPreference);

  const formatPreferenceContent =
    `
    <figure class="table">
      <table style="border-color: hsl(0, 0%, 100%); border-style: solid;">
        <thead>
          <tr>
          <th style="border-color: hsl(0, 0%, 100%); border-style: solid; width: 260px; text-align: left;">Scheduling Preferences</th>
          <th style="border-color: hsl(0, 0%, 100%); border-style: solid; width: 100px; text-align: left;">Sync</th>
          <th style="border-color: hsl(0, 0%, 100%); border-style: solid; width: 100px; text-align: left;">Async</th>
          <th style="border-color: hsl(0, 0%, 100%); border-style: solid; width: 250px; text-align: left;">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;"><em>${userName}</em></td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${userSync}</td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${userAsync}</td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${formDataSourceUser.formatNotes}</td>
          </tr>
          <tr>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;"><em>${targetUserName}</em></td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${targetUserSync}</td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${targetUserAsync}</td>
            <td style="border-color: hsl(0, 0%, 100%); border-style: solid;">${formDataTargetUser.formatNotes}</td>
          </tr>
        </tbody>
      </table>
      </figure>
    `

  const isYesOrOkay = (value: string) => ["Yes", "Okay"].includes(value);

  const syncMatch = (isYesOrOkay(userSync) && isYesOrOkay(targetUserSync))
  const asyncMatch = (isYesOrOkay(userAsync) && isYesOrOkay(targetUserAsync))
  const formatPreferenceMatch = syncMatch ?? asyncMatch

  let nextAction = `
    <p><strong>Next</strong> <strong>steps</strong></p>
    <ol>
      <li>Chat to agree on topic ${syncMatch ? `and potential scheduling (tip: <a href="https://www.when2meet.com/">when2meet.com</a> is a great scheduling tool)` : ``}</li>
      <li>If you agree on something, have your dialogue</li>
      <li>Edit (remove any side chats like this message, and feel free to request editing services from the LessWrong team, button below)</li>
      <li>Publish!</li>
    </ol>
  `

  if (!formatPreferenceMatch && sharedTopics.length === 0) {
    nextAction =
    `<p><strong>Next</strong> <strong>steps</strong></p> 
     <p>It seems you have different format preferences, and also didn't have any topics in common yet. So a dialogue might not make sense here. That's alright, feel free to call it a "good try" 
     and then move on :)</p>`
  }

  if (!formatPreferenceMatch && sharedTopics.length > 0) {
    nextAction =
    ` <p><strong>Next</strong> <strong>steps</strong></p>
      <p>It seems you have different format preferences, so a dialogue might not make sense here.</p>
      <p>You did still had some common topics of interest though, so we made this chat to let you know</p>`
  }

  if (sharedTopics.length === 0 && sourceUserTopics.length === 0) {
    nextAction =
    `<p><strong>Next</strong> <strong>steps</strong></p>
     <p>It seems you have didn't have any topics in common (yet!), so a dialogue might not make sense here. That's alright, we still made this chat for you to take a look and see whether there's anything here :)</p>`
  }

  if (sharedTopics.length === 0 && sourceUserTopics.length > 0) {
    nextAction =
    `<p><strong>Next</strong> <strong>steps</strong></p>
     <p>You have didn't have any topics in common yet, so a dialogue might not make sense here. But ${targetUserName} has not yet seen the ${sourceUserTopics.length} topic suggestions ${userName} added, so we still made this so you could see whether there's anything here :)</p>`
  }

  


  const messagesCombined = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", `${topicMessageContent}${formatPreferenceContent}${nextAction}`)

  return `<div>${messagesCombined}</div>`
}

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

  const reciprocalMatchPreferences = await context.DialogueMatchPreferences.findOne({dialogueCheckId: reciprocalDialogueCheck._id});
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
    displayName: currentUser.displayName,
  }
  const formDataTargetUser = {
    ...reciprocalMatchPreferences,
    userId: targetUserId,
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
    context: createAdminContext()
  });

  userMatchPreferences.generatedDialogueId = generatedDialogueId;

  return userMatchPreferences;
});
