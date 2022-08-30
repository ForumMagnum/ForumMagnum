import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';

registerMigration({
  name: "syncEmailsFields",
  dateWritten: "2022-08-29",
  idempotent: true,
  action: async () => {
    const usersMissingEmail = await Users.find({email: null, emails:{$exists:true}}).fetch()

    // eslint-disable-next-line no-console
    console.log(`setting emails for ${usersMissingEmail.length} users`)

    let syncedUserCount = 0

    let duplicateEmails: Array<string> = [] 

    for (const user of usersMissingEmail) {
      const email = user.emails && (user.emails[0]?.address || user.emails[0]?.value) as string
      if (email) {
        const duplicateUsers = await Users.find({email}).fetch()
        if (duplicateUsers.length === 0) {
          await Users.rawUpdateOne({_id: user._id}, {$set: {email}})
          // eslint-disable-next-line no-console
          console.log("setting email to:", email)
          syncedUserCount += 1
        } else {
          duplicateEmails.push(email)
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log(`Synced users: ${syncedUserCount}`)
    // eslint-disable-next-line no-console
    console.log(`Users who were not synced due to duplicate emails: ${usersMissingEmail.length - syncedUserCount}`)
    console.log(duplicateEmails)
  }  
})