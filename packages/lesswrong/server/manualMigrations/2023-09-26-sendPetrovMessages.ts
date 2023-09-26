import chunk from "lodash/chunk";
import Conversations from "../../lib/collections/conversations/collection";
import Messages from "../../lib/collections/messages/collection";
import Users from "../../lib/collections/users/collection";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { forumTeamUserId } from "../callbacks/userCallbacks";
import { createMutator } from "../vulcan-lib/mutators";
import { registerMigration } from "./migrationUtils";
import { sleep } from "../../lib/helpers";

async function sendMessageTo(userId: string) {  
  const user = await Users.findOne(userId);
  if (!user) throw new Error(`Could not find ${userId}`);
  
  // try to use forumTeamUserId as the sender,
  // and default to the admin account if not found
  const adminUserId = forumTeamUserId.get()
  let adminsAccount = adminUserId ? await Users.findOne({_id: adminUserId}) : null
  if (!adminsAccount) {
    adminsAccount = await getAdminTeamAccount()
  }
  
  const subjectLine = ''; // TODO
  const welcomeMessageBody = ''; // TODO
  
  const conversationData = {
    participantIds: [user._id, adminsAccount._id],
    title: subjectLine,
  }
  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: adminsAccount,
    validate: false
  });
  
  const messageDocument = {
    userId: adminsAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: welcomeMessageBody,
      }
    },
    conversationId: conversation.data._id,
    noEmail: true,
  }
  await createMutator({
    collection: Messages,
    document: messageDocument,
    currentUser: adminsAccount,
    validate: false
  })
}

registerMigration({
  name: "sendPetrovMessages",
  dateWritten: "2023-09-26",
  idempotent: true,
  action: async () => {
    // TODO - make this file
    const userIds: string[] = require('./petrovUserIds.json');

    // TODO - decide batch size
    const userIdBatches = chunk(userIds, 5);

    for (const batch of userIdBatches) {
      await Promise.all(batch.map(sendMessageTo));

      // Give the db some time to handle everything, if needed
      await sleep(300);
    }
  }
})
