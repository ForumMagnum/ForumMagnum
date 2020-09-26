
import { registerMigration } from './migrationUtils';
import { newMutation } from '../vulcan-lib';
import { Conversations } from '../../lib/collections/conversations/collection';
import { Users } from '../../lib/collections/users/collection';
import { Messages } from '../../lib/collections/messages/collection';

const sendingAccountId = "XtphY3uYHwruKqDyG";

const getMessageContents = (name: string, code: string) => `
<p>Hello ${name}, </p>
<p>On Petrov Day, we celebrate and practice not destroying the world.</p>
<p>As is our annual tradition, I have selected a group of (275) LessWrong users to be given the opportunity of not
    destroying LessWrong.</p>
<p>This Petrov Day, if you, ${name}, enter the launch codes below on LessWrong, the Frontpage will go down for
    24 hours, destroying a resource thousands of people view every day.</p>
<p>Your personalised launch code: ${code} </p>
<p>I hope to see you on the other side of this, with our honor intact.</p>
<p>–Ben Pace & the LessWrong Team </p>
<p>P.S. Here is <a href="https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019">the
    on-site announcement</a>.
</p>`

const userCodes = {
  EQNTWXLKMeWMp2FQS: "asdsadsa"
}


registerMigration({
  name: "sendPetrovMessages",
  dateWritten: "2020-09-08",
  idempotent: true,
  action: async () => {

    const receivingUserIds = ["EQNTWXLKMeWMp2FQS", "EQNTWXLKMeWMp2FQS"]

    for (const receivingUserId of receivingUserIds) {
      const sendingUser = Users.findOne({ _id: sendingAccountId });
      const receivingUser = Users.findOne({ _id: receivingUserId })

      const conversationData = {
        participantIds: [receivingUserId, sendingAccountId],
        title: `Honoring Petrov Day: I am trusting you with the launch codes`
      };
      const conversation = await newMutation({
        collection: Conversations,
        document: conversationData,
        currentUser: sendingUser,
        validate: false
      });

      const displayName = receivingUser?.displayName

      if (displayName) {
        const firstMessageData = {
          userId: sendingAccountId,
          contents: {
            originalContents: {
              type: "html",
              data: getMessageContents(displayName, userCodes[receivingUserId])
            }
          },
          conversationId: conversation.data._id
        }

        await newMutation({
          collection: Messages,
          document: firstMessageData,
          currentUser: sendingUser,
          validate: false
        })
      }
    }
  }
})
