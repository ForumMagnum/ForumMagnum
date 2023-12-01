/* eslint-disable no-console */
import Conversations from "../../lib/collections/conversations/collection";
import Messages from "../../lib/collections/messages/collection";
import Users from "../../lib/collections/users/collection";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { forumTeamUserId } from "../callbacks/userCallbacks";
import { createMutator } from "../vulcan-lib/mutators";
import { registerMigration } from "./migrationUtils";
import { sleep } from "../../lib/helpers";

async function sendMessageTo(userId: string, welcomeMessageBody: string) {
  const user = await Users.findOne(userId);
  if (!user) throw new Error(`Could not find ${userId}`);

  // try to use forumTeamUserId as the sender,
  // and default to the admin account if not found
  const adminUserId = forumTeamUserId.get();
  let adminsAccount = adminUserId ? await Users.findOne({ _id: adminUserId }) : null;
  if (!adminsAccount) {
    adminsAccount = await getAdminTeamAccount();
  }
  if (!adminsAccount) throw new Error("Could not find admin account");

  const subjectLine = "Voting in the Donation Election has opened";

  // console.log({userId, subjectLine, welcomeMessageBody})

  const conversationData = {
    participantIds: [user._id, adminsAccount._id],
    title: subjectLine,
  };
  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: adminsAccount,
    validate: false,
  });

  const messageDocument = {
    userId: adminsAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: welcomeMessageBody,
      },
    },
    conversationId: conversation.data._id,
    noEmail: false,
  };
  await createMutator({
    collection: Messages,
    document: messageDocument,
    currentUser: adminsAccount,
    validate: false,
  });
}

registerMigration({
  name: "sendVotingPortalNotification",
  dateWritten: "2023-11-30",
  idempotent: true,
  action: async () => {
    console.log("Starting sendVotingPortalNotification");
    const users = await Users.find({ givingSeasonNotifyForVoting: true }).fetch();

    console.log(`About to send messages to ${users.length} users`);


    // Voting in the Forum’s Donation Election has opened!
    //
    // To vote, go to the Voting Portal. You’ll be able to change your vote until voting closes on December 15.
    //
    // The Voting Portal should explain what to do, but feel free to reply to this message if you have any questions.
    //
    // Thanks, and happy voting!
    //
    // SIGNOFF
    // P.S. You’re getting this message because you signed up to get notified when voting opens. If something went wrong, please let me know!
    const message = `
      <p>
        Voting in the Forum’s <a href="https://forum.effectivealtruism.org/giving-portal#election">Donation Election</a> has opened!
      </p>
      <p>
        To vote, go to the <a href="https://forum.effectivealtruism.org/voting-portal">Voting portal</a>. You’ll be able to change your vote until voting closes on December 15.
      </p>
      <p>
        The Voting Portal should explain what to do, but feel free to reply to this message if you have any questions.
      </p>
      <p>
        Thanks, and happy voting!
        <br><a href="https://forum.effectivealtruism.org/users/will-howard-1">Will</a>, on behalf of the Forum team
      </p>
      <p>
        <em>P.S. You’re getting this message because you signed up to get notified when voting opens.</em>
      </p>
    `;

    for (const user of users) {
      console.log(`Sending to ${user.displayName}`);
      await sendMessageTo(user._id, message);

      // The sleep here is just to give a chance to notice something going horribly wrong,
      // there are only about 50 users with this flag set, so it should take about a minute in total
      await sleep(1000);
    }
  },
});
