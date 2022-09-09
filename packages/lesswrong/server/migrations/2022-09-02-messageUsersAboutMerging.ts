import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import Conversations from '../../lib/collections/conversations/collection';
import { createMutator } from '../vulcan-lib/mutators';
import Messages from '../../lib/collections/messages/collection';
import fs from 'fs';
import Papa from 'papaparse';


const sendDuplicateEmailMessage = async (users: Array<DbUser>, currentUser: DbUser) => {

  if (users.length < 2 || !currentUser) return
  const user = users[0]
  const userIds = users.map(user => user._id)
  const adminUserIds = [
    'r38pkCm7wF4M44MDQ', // Raemon
    'grecHJcgkb3KW5wnM', // RobertM
    'qgdGA4ZEyW7zNdK84' // Ruby
  ]

  const conversationData = {
    participantIds: [...userIds, ...adminUserIds],
    title: `Duplicate accounts with a shared email`
  }
  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: currentUser,
    validate: false
  });
  const userProfiles = users.map(user=>`<li key=${user._id}><a href=${userGetProfileUrl(user)}>${user.displayName}</a></li>`).join("")

  const message = `
    <p>Hey ${user.displayName},</p>
    <p>We've detected multiple LessWrong accounts sharing the email ${user.email}. They are:</p>
    <ul>
      ${userProfiles}
    </ul>
    <p>I'm guessing you ended up with multiple accounts accidentally. We can merge them into a single user (which would then be listed as the author of all the posts, comments, and have the appropriate karma).</p>
    <p>Which user do you prefer to get merged into? (essentially this just means "which username do you want to keep?)</p>
  `

  const messageData = {
    userId: currentUser._id,
    contents: {
      originalContents: {
        type: "html",
        data: message
      }
    },
    conversationId: conversation.data._id
  }

  await createMutator({
    collection: Messages,
    document: messageData,
    currentUser,
    validate: false
  })
}

registerMigration({
  name: "messageUsersAboutMerging",
  dateWritten: "2022-08-29",
  idempotent: true,
  action: async () => {
    
    // get a list of all emails
    const users = await Users.aggregate([
      {"$match":   { "lastNotificationsCheck": {$exists: true}, "karma": {$gte:0}}}, // filter out users who aren't actively involved with LW or aren actively bad
      {"$group" :  { "_id": "$email", "count": { "$sum": 1 } } }, // get a list of all emails and the number of accounts with that email
      {"$match":   {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} }}, // only show emails with more than 1 account
      {"$project": {"email" : "$_id", "_id" : 0} }
    ]).toArray()

    // eslint-disable-next-line no-console
    console.log(`Messaging ${users.length} users`)

    let output: Array<Object> = []

    const currentUser = await Users.findOne({_id:"r38pkCm7wF4M44MDQ"}) //Raemon
    if (!currentUser) throw Error("Can't find user r38pkCm7wF4M44MDQ")

    const singleResultUsers = []
    const multipleResultUsers = []

    for (const user of users) {
      // eslint-disable-next-line no-console
      // console.log(`Sending message to users with email: ${user.email}`)
      const users = await Users.find({email: user.email}).fetch()

      const highKarmaUsers = [...users].sort((user1, user2) => (user2.karma || 0) - (user1.karma || 0))
      const highKarmaUser = highKarmaUsers[0]
      const latestCheckedUsers = [...users].sort((user1, user2) => {
        if (user1.lastNotificationsCheck === user2.lastNotificationsCheck) return 0
        if (user1.lastNotificationsCheck < user2.lastNotificationsCheck) {
          return 1
        } else {
          return -1
        }
      })
      // console.log(latestCheckedUsers.map(user=>user.lastNotificationsCheck))
      // console.log(highKarmaUsers.map(user=>user.karma))

      const latestCheckedUser = latestCheckedUsers[0]

      if ((highKarmaUser._id !== latestCheckedUser._id) && (latestCheckedUser.karma > 100)) {
        multipleResultUsers.push(users.map(user=> [user.displayName, user.karma, user.lastNotificationsCheck]))
        // console.log("highKarmaUser", highKarmaUser._id, highKarmaUser.displayName, highKarmaUser.slug)
        // console.log("latestCheckedUser", latestCheckedUser._id, latestCheckedUser.displayName, latestCheckedUser.slug)
      } else {
        singleResultUsers.push(users.map(user=> [user.displayName, user.karma, user.lastNotificationsCheck]))
      }

      output.push({
        email: user.email,
        userIds: users.map(user => user._id),
        displayNames: users.map(user => user.displayName)
      })
      // await sendDuplicateEmailMessage(users, currentUser)
    }
    console.log("multipleResultUsers", multipleResultUsers)
    console.log("singleResultUsers", singleResultUsers.length)
    console.log("multipleResultUsers", multipleResultUsers.length)
    await fs.writeFile(`tmp/messageUsersAboutMerging-${new Date()}.csv`, Papa.unparse(output), (err) => console.log(err))
  }
})
