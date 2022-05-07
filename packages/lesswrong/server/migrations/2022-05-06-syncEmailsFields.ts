import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';

registerMigration({
  name: "syncEmailsFields",
  dateWritten: "2022-05-06",
  idempotent: true,
  action: async () => {
    const usersMissingEmail = await Users.find({email: null}).fetch()
    
    for (const user of usersMissingEmail) {
      const email = user.emails && (user.emails[0]?.address || user.emails[0]?.value)
      if (email) {
        await Users.rawUpdateOne({_id: user._id}, {$set: {email}})
        // eslint-disable-next-line no-console
        console.log("setting email to:", email)
      }
    }
  }
  
  
})
