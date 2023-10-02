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
  
  const subjectLine = 'Petrov Day Poll';
  const welcomeMessageBody = '<p>Today is&nbsp;<a href="https://www.lesswrong.com/posts/QtyKq4BDyuJ3tysoK/9-26-is-petrov-day"><u>Petrov Day</u></a>! A day celebrating that the world didn’t end, and the virtues that helped it not end. There’s been a lot of discussion.</p><p>This year we’re conducting a poll about Petrov Day virtues. Please click the link of the virtue you think is most important (you’d preserve that over all others). Only the first link you click on will count towards the results.</p><p>The Virtues</p><ul><li><a href="https://lesswrong.com/petroyDayPoll?choice=A"><u>Virtue A – Avoiding actions that noticeably increase the chance that civilization is destroyed</u></a></li><li><a href="https://lesswrong.com/petroyDayPoll?choice=B"><u>Virtue B – Accurately reporting your epistemic state</u></a></li><li><a href="https://lesswrong.com/petroyDayPoll?choice=C"><u>Virtue C – Quickly orienting to novel situations</u></a></li><li><a href="https://lesswrong.com/petroyDayPoll?choice=D"><u>Virtue D – Resisting social pressure</u></a></li></ul><p>Thank you!</p><p>- The LessWrong Team</p>'
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
