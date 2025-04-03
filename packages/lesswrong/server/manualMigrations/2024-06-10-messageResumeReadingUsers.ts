import { registerMigration } from './migrationUtils';
import { Users } from '../../server/collections/users/collection';
import { getAdminTeamAccount } from '../utils/adminTeamAccount';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { adminAccountSetting } from '@/lib/publicSettings';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { createConversation } from '../collections/conversations/mutations';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createMessage } from '../collections/messages/mutations';

const messageResumeReadingUsers = async (user: DbUser) => {
  const context = createAnonymousContext();
  const adminEmail = adminAccountSetting.get()?.email ?? "";
  const message = `<div
    <p>Hey ${userGetDisplayName(user)},</p>
    <p>I wanted to send you a heads up that we have removed the Resume Reading tab from the frontpage. You have been switched to the Enriched tab instead.</p>
    <p>Unfortunately Resume Reading wasn't getting enough use to justify it's spot. If you were using it, please let us know and we'll figure out a new location for it.</p>
    <p>Feel free to ask us questions via Intercom or email (team@lesswrong.com). This inbox isn't monitored, but I'm keen to hear from you!</p>
    <p>Best,<br>
    Ruby (LW Team)</p>
  </div>`
  
  const lwAccount = await getAdminTeamAccount(context)

  if (!lwAccount) {
    throw new Error("Unable to find the lwAccount to send message to user")
  }

  const conversationData = {
    participantIds: [user._id, lwAccount._id],
    title: "We are removing the Resume Reading tab"
  }
  
  const lwAccountContext = await computeContextFromUser({ user: lwAccount, isSSR: false });

  const conversation = await createConversation({ data: conversationData }, lwAccountContext, true);

  const firstMessageData = {
    userId: lwAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: message
      }
    },
    conversationId: conversation._id
  }

  void createMessage({ data: firstMessageData }, lwAccountContext, true);
}


export default registerMigration({
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
