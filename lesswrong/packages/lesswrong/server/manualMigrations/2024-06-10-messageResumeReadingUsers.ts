import { registerMigration } from './migrationUtils';
import { Users } from '../../lib/collections/users/collection';
import { Conversations } from '../../lib/collections/conversations/collection';
import { Messages } from '../../lib/collections/messages/collection';
import { getAdminTeamAccount } from '../callbacks/commentCallbacks';
import { createMutator } from '../vulcan-lib';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { adminAccountSetting } from '@/lib/publicSettings';

const messageResumeReadingUsers = async (user: DbUser) => {

  const adminEmail = adminAccountSetting.get()?.email ?? "";
  const message = `<div
    <p>Hey ${userGetDisplayName(user)},</p>
    <p>I wanted to send you a heads up that we have removed the Resume Reading tab from the frontpage. You have been switched to the Enriched tab instead.</p>
    <p>Unfortunately Resume Reading wasn't getting enough use to justify it's spot. If you were using it, please let us know and we'll figure out a new location for it.</p>
    <p>Feel free to ask us questions via Intercom or email (team@lesswrong.com). This inbox isn't monitored, but I'm keen to hear from you!</p>
    <p>Best,<br>
    Ruby (LW Team)</p>
  </div>`
  
  const lwAccount = await getAdminTeamAccount()

  if (!lwAccount) {
    throw new Error("Unable to find the lwAccount to send message to user")
  }

  const conversationData = {
    participantIds: [user._id, lwAccount._id],
    title: "We are removing the Resume Reading tab"
  }

  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: lwAccount,
    validate: false,
  });

  const firstMessageData = {
    userId: lwAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: message
      }
    },
    conversationId: conversation.data._id
  }

  void createMutator({
    collection: Messages,
    document: firstMessageData,
    currentUser: lwAccount,
    validate: false,
  })
}


registerMigration({
  name: "messageResumeReadingUsers",
  dateWritten: "2024-06-10",
  idempotent: true,
  action: async () => {
    const users = await Users.find({frontpageSelectedTab: 'forum-continue-reading'}).fetch();

    for (let user of users) {
      void messageResumeReadingUsers(user);
    }
  },
});
