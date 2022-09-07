import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import fs from 'fs';
import Papa from 'papaparse';

registerMigration({
  name: "syncEmailsFields",
  dateWritten: "2022-08-29",
  idempotent: true,
  action: async () => {
    const totalUsersMissingEmail =  await Users.find({email: null}).fetch()
    const totalRecentUsersMissingEmail =  totalUsersMissingEmail.filter(user => !user.email && user.lastNotificationsCheck)

    // eslint-disable-next-line no-console
    console.log(`There are ${totalUsersMissingEmail.length} users missing an email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${totalRecentUsersMissingEmail.length} users missing an email who've checked notifications in past 3 years`)

    const usersEmailsToEmail = totalUsersMissingEmail.filter(user => !user.email && user.emails)
    const usersGoogleToEmail = totalUsersMissingEmail.filter(user => !user.email && user.services?.google?.email)
    const usersGithubToEmail = totalUsersMissingEmail.filter(user => !user.email && user.services?.github?.email)
    const usersFacebookToEmail = totalUsersMissingEmail.filter(user => !user.email && user.services?.facebook?.email)
    
    
    // eslint-disable-next-line no-console
    console.log(`There are ${usersEmailsToEmail.length} users who's emails.address fields could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersGoogleToEmail.length} users who's google address could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersGithubToEmail.length} users who's github address fields could fill in email`)
    // eslint-disable-next-line no-console
    console.log(`There are ${usersFacebookToEmail.length} users who's facebook address fields could fill in email`)

    const usersMissingEmails = [...usersEmailsToEmail, ...usersGoogleToEmail, ...usersGithubToEmail, ...usersFacebookToEmail]

    const output: Array<Object> = []

    // eslint-disable-next-line no-console
    console.log(`setting emails for ${usersMissingEmails.length} users`)
    for (const user of usersMissingEmails) {
      const firstEmail = user.emails?.[0]
      const newEmail = firstEmail?.address || firstEmail?.value || user.services?.google?.email || user.services?.facebook?.email || user.services?.github?.email

      if (newEmail) {
        const outputRow = {
          _id: user._id, 
          displayName: user.displayName,
          email: newEmail,
          errors: null
        }
        try {
          await Users.rawUpdateOne({_id: user._id}, {$set: {newEmail}})
        } catch (err) {
          console.log("ERR:", err)
          outputRow.errors = err
        }
        output.push(outputRow)
      }
    }

    fs.writeFile(`tmp/syncEmailFields-${new Date()}.csv`, Papa.unparse(output), (err) => console.log("err"))
  }  
})
