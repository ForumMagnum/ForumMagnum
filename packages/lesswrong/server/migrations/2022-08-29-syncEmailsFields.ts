import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';

registerMigration({
  name: "syncEmailsFields",
  dateWritten: "2022-08-29",
  idempotent: true,
  action: async () => {
    const totalUsersMissingEmail =  await Users.find({email: null})
    const totalRecentUsersMissingEmail =  await Users.find({email: null, lastNotificationsCheck: {$exists:true}})

    // eslint-disable-next-line no-console
    console.log(`There are ${totalUsersMissingEmail.count()} users missing an email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${totalRecentUsersMissingEmail.count()} users missing an email who've checked notifications in past 3 years`)

    const usersEmailsToEmail = await Users.find({email: null, emails:{$ne:null}}).fetch()
    const usersGoogleToEmail = await Users.find({email: null, 'services.google.email':{$ne:null}}).fetch()
    const usersGithubToEmail = await Users.find({email: null, 'services.github.email':{$ne:null}}).fetch()
    const usersFacebookToEmail = await Users.find({email: null, 'services.facebook.email':{$ne:null}}).fetch()
    
    // eslint-disable-next-line no-console
    console.log(`There are ${usersEmailsToEmail.length} users who's emails.address fields could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersGoogleToEmail.length} users who's google address could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersGithubToEmail.length} users who's github address fields could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersFacebookToEmail.length} users who's facebook address fields could fill in email`)

    const usersMissingEmails = [...usersEmailsToEmail, ...usersGoogleToEmail, ...usersGithubToEmail, ...usersFacebookToEmail]

    // eslint-disable-next-line no-console
    console.log(`setting emails for ${usersMissingEmails.length} users`)
    for (const user of usersMissingEmails) {
      const firstEmail = user.emails?.[0]
      const email = firstEmail?.address || firstEmail?.value || user.services?.google?.email || user.services?.facebook?.email || user.services?.github?.email

      if (email) {
          // eslint-disable-next-line no-console
          console.log("setting email to:", email)
          await Users.rawUpdateOne({_id: user._id}, {$set: {email}})
      }
    }
  }  
})
