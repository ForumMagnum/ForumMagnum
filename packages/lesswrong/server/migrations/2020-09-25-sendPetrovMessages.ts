
import { registerMigration } from './migrationUtils';
import { newMutation } from '../vulcan-lib';
import { Conversations } from '../../lib/collections/conversations/collection';
import { Users } from '../../lib/collections/users/collection';
import { Messages } from '../../lib/collections/messages/collection';

const sendingAccountId = "6bgx9sEsqbZd9JRQi";

const getMessageContents = (name: string, code: string) => `
<p>Hey ${name},</p>
<p>
  I grant you a great opportunity today to destroy the lives of many fellow LessWrong users
  using this small code and a great big button:
</p>
<p>
  ${code}
</p>
<p>Good luck!</p>
<p>Best, </p>
<p>Ben Pace </p>
`

const userCodes = {
  ArkJChzSNsKGHwTAR: "asdsadsa"
}


registerMigration({
  name: "sendPetrovMessages",
  dateWritten: "2020-09-08",
  idempotent: true,
  action: async () => {

    const receivingUserIds = ["ArkJChzSNsKGHwTAR"]

    for (const receivingUserId of receivingUserIds) {
      const sendingUser = Users.findOne({_id: sendingAccountId});
      const receivingUser = Users.findOne({_id: receivingUserId})

      const conversationData = {
        participantIds: [receivingUserId, sendingAccountId],
        title: `Your Petrov Day Codes`
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
