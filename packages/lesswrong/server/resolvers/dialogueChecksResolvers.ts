import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { randomId } from "../../lib/random";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import { createNotifications } from "../notificationCallbacksHelpers";
import DialogueChecksRepo from "../repos/DialogueChecksRepo";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { createMutator } from '../vulcan-lib';
import Messages from '../../lib/collections/messages/collection';
import Conversations from "../../lib/collections/conversations/collection";
import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection";

import { getUser } from '../../lib/vulcan-users/helpers';
import { getAdminTeamAccount } from '../../server/callbacks/commentCallbacks.ts'
import {SyncPreference} from "../../lib/collections/dialogueMatchPreferences/schema.ts";

async function notifyUsersMatchingDialogueChecks (dialogueCheck: DbDialogueCheck, match: DbDialogueCheck, associatedMessage?: DbMessage) {
  await createNotifications({
    userIds: [dialogueCheck.userId],
    notificationType: "newDialogueMatch",
    documentType: "dialogueCheck",
    documentId: dialogueCheck._id,
    extraData: {associatedMessage}
  });
  await createNotifications({
    userIds: [match.userId],
    notificationType: "newDialogueMatch",
    documentType: "dialogueCheck",
    documentId: match._id,
    extraData: {associatedMessage}
  });
}

async function messageUsersMatchingDialogueChecks (
  userId: string,
  targetUserId: string,
  topicNotes: string,
  formatSync: boolean,
  formatAsync: boolean,
  formatNotes: string
) {
  const lwAccount = await getAdminTeamAccount();
  const currentUser = await getUser(userId);
  const targetUser = await getUser(targetUserId);

  // Create a new conversation with both users
  const conversationData = {
    participantIds: [userId, targetUserId, lwAccount._id],
    title: `Dialogue Match between ${currentUser?.displayName} and ${targetUser?.displayName}!`
  }

  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: lwAccount,
    validate: false,
  });

  let messageContents =
    `<div>
      <p>You two have matched via Dialogue Matching! You can now message each other to brainstorm potential dialogue topics or set up a time to talk.</p>
      <p>For some ideas of conversation topics, feel free to look at <a href="https://www.lesswrong.com/posts/hc9nMipTXy2sm3tJb/vote-on-interesting-disagreements">this list of interesting disagreements</a>.</p>

      <p>Notes from ${currentUser?.displayName}:</p>
      ${topicNotes ? `<p>On topics: "${topicNotes}"</p>` : ''}
      ${formatSync ? `<p>• Up for sync</p>` : ''}
      ${formatAsync ? `<p>• Up for async</p>` : ''}
      ${formatNotes ? `<p>Format notes: "${formatNotes}"</p>` : ''}
    </div>`

  // Add a message to the conversation
  const messageData = {
    userId: lwAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: messageContents
      }
    },
    conversationId: conversation.data._id
  }

  const message = await createMutator({
    collection: Messages,
    document: messageData,
    currentUser: lwAccount,
    validate: false,
  });

  return message;
}

defineMutation({
  name: "messageUserDialogueMatch",
  resultType: "Message",
  argTypes: "(userId: String!, targetUserId: String!, topicNotes: String!, formatSync: Boolean!, formatAsync: Boolean!, formatOther: Boolean!, formatNotes: String!)",
  fn: async (_, {userId, targetUserId, topicNotes, formatSync, formatAsync, formatNotes}:{userId:string, targetUserId:string, topicNotes:string, formatSync:SyncPreference, formatAsync:SyncPreference, formatNotes:string}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No current user was provided")

    const { data: message }  = await messageUsersMatchingDialogueChecks(userId, targetUserId, topicNotes, formatSync, formatAsync, formatNotes)

    return message;    
  } 
})

// defineMutation({
//   name: "createDialogueMatchPreference",
//   resultType: "DialogueMatchPreference",
//   argTypes: '(dialogueCheckId: String!, topicNotes: String!, syncPreference: "Yes" | "Meh" | "No"!, asyncPreference: "Yes" | "Meh" | "No"!, formatNotes: String!)',
//   fn: async (_, {dialogueCheckId, topicNotes, syncPreference, asyncPreference, formatNotes}:{dialogueCheckId:string, topicNotes:string, syncPreference:'Yes' | 'Meh' | 'No', asyncPreference:'Yes' | 'Meh' | 'No', formatNotes:string}, {currentUser, repos}) => {
//     if (!currentUser) throw new Error("No current user was provided")

//     const dialogueMatchPreferenceData = {
//       dialogueCheckId,
//       topicNotes,
//       syncPreference,
//       asyncPreference,
//       formatNotes
//     };

//     const dialogueMatchPreference = await createMutator({
//       collection: DialogueMatchPreferences,
//       document: dialogueMatchPreferenceData,
//       currentUser,
//       validate: false,
//     });

//     return dialogueMatchPreference;
//   } 
// })

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")    
    const response = await repos.dialogueChecks.upsertDialogueCheck(currentUser._id, targetUserId, checked)    
    return response
  } 
})

export const getMatchingDialogueCheck = async (dialogueCheck : DbDialogueCheck) => {
  return await new DialogueChecksRepo().checkForMatch(dialogueCheck.userId, dialogueCheck.targetUserId) 
}

augmentFieldsDict(DialogueChecks, {
  match: {
    resolveAs: {
      fieldName: 'match',
      type: 'Boolean',
      resolver: async (check: DbDialogueCheck, args: void, context: ResolverContext): Promise<boolean> => {
        const currentUser = context.currentUser
        if (!currentUser) throw Error("Can't get match without current User")
        const match = await getMatchingDialogueCheck(check)
        return !!match
      },
    }
  }
})
