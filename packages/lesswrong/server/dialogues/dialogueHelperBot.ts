import {renderToString} from "react-dom/server";
import {Components} from "../vulcan-lib";
import {createElement} from "react";

export const helperBotDisplayName = "Dialogue Helper Bot"
export const helperBotId = "jHkqasDqh8HHLen6z"

export interface MatchPreferenceFormData extends DbDialogueMatchPreference {
  displayName: string;
  userId: string
}

function convertTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toUTCString();
}

export const getDialogueMessageHTML = (userId:string, displayName:string, order:string, content:string ) => {
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

export function getUserTopics (formData: MatchPreferenceFormData|DbDialogueMatchPreference) {
  return formData.topicPreferences
    .filter(({ preference }) => preference === "Yes")
    .map(({ text }) => text);
}

function switchMehForOkay(preference: string): string {
  return preference === "Meh" ? "Okay" : preference;
}

export function getSyncAsyncPreferences(user: DbDialogueMatchPreference) {
  return {
    sync: switchMehForOkay(user.syncPreference),
    async: switchMehForOkay(user.asyncPreference)
  };
}

const isYesOrOkay = (value: string) => ["Yes", "Okay"].includes(value);

export function getPreferenceMatches(userPreferences: {sync: string, async: string}, targetUserPreferences: {sync: string, async: string}) {
  const syncMatch = isYesOrOkay(userPreferences.sync) && isYesOrOkay(targetUserPreferences.sync);
  const asyncMatch = isYesOrOkay(userPreferences.async) && isYesOrOkay(targetUserPreferences.async);
  const formatPreferenceMatch = syncMatch ?? asyncMatch;
  return { syncMatch, asyncMatch, formatPreferenceMatch };
}

export const welcomeMessage = (formDataSourceUser: MatchPreferenceFormData, formDataTargetUser: MatchPreferenceFormData) => {
  const userName = formDataSourceUser.displayName;
  const targetUserName = formDataTargetUser.displayName;

  const { CalendlyIFrame } = Components

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
  
  // Ugly solution for now since we had the database entry read "meh" but the client form entry read "okay"
  const { sync: userSync, async: userAsync } = getSyncAsyncPreferences(formDataSourceUser);
  const { sync: targetUserSync, async: targetUserAsync } = getSyncAsyncPreferences(formDataTargetUser);

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


  const { syncMatch, asyncMatch, formatPreferenceMatch } = getPreferenceMatches(
    { sync: userSync, async: userAsync },
    { sync: targetUserSync, async: targetUserAsync }
  );

  let nextAction = `
    <p><strong>Next</strong> <strong>steps</strong></p>
    <ol>
      <li>Chat about topic ${syncMatch ? `and potential scheduling (tip: <a href="https://www.when2meet.com/">when2meet.com</a> is a great scheduling tool)` : ``}</li>
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

  
  const sourceCalendly = formDataSourceUser.calendlyLink ? (
    `<p><strong>${formDataSourceUser.displayName}</strong> <strong>shared a Calendly</strong></p>
    ${renderToString(createElement(CalendlyIFrame, {url: formDataSourceUser.calendlyLink}))}`
  ) : ''
  const targetCalendly = formDataTargetUser.calendlyLink ? (
    `<p><strong>${formDataTargetUser.displayName}</strong> <strong>shared a Calendly</strong></p>
    ${renderToString(createElement(CalendlyIFrame, {url: formDataTargetUser.calendlyLink}))}`
  ) : ''

  const calendlys = sourceCalendly + targetCalendly

  const messagesCombined = getDialogueMessageHTML(helperBotId, helperBotDisplayName, "1", `${topicMessageContent}${formatPreferenceContent}${nextAction}${calendlys}`)

  return `<div>${messagesCombined}</div>`
}
