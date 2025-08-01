import { wrapVulcanAsyncScript } from './utils'
import Users from '../../server/collections/users/collection'
import { backgroundTask } from '../utils/backgroundTask';

/*
 * This script attempts to ensure that all users with an "email" value
 * also have that email address listed in their "emails" array,
 * by appending it to the array if it is not already there
 * and it is not in another user's "emails" array.
 *
 * Exported to allow running manually with "yarn repl"
 */
export const ensureEmailInEmails = wrapVulcanAsyncScript(
  'ensureEmailInEmails',
  async () => {
    const allUsers = Users.find({}, {projection: {emails: 1}});
    // build a set of all email addresses from the "emails", to be used in a later comparison
    const allEmails = new Set();
    for (const user of await allUsers.fetch()) {
      if (user.emails && user.emails.length) {
        user.emails.forEach(email => allEmails.add(email.address?.toLowerCase()));
      }
    }
    
    // {$nin: [null, ''] excludes users without the email field because mongo considers undefined as equal to null
    const usersWithEmail = Users.find({
      email: {$nin: [null, '']},
    }, {projection: {email: 1, emails: 1}});
    
    for (const user of await usersWithEmail.fetch()) {
      // goddamnit
      if (user.email === 'foo@example.com') {
        continue;
      }
      
      // if the user's email is already in emails, skip them because their data is already correct
      if (user.email && user.emails && user.emails.map(email => email.address?.toLowerCase()).includes(user.email.toLowerCase())) {
        continue;
      }

      if (user.email && allEmails.has(user.email.toLowerCase())) {
        // eslint-disable-next-line no-console
        console.log("email found in another user's account:", user.email);
      } else {
        // add email to emails
        const newEmail = {address: user.email, verified: true};
        const newEmails = user.emails ? [...user.emails, newEmail] : [newEmail]
        backgroundTask(Users.rawUpdateOne(user._id, {$set: {'emails': newEmails}}));
        // eslint-disable-next-line no-console
        console.log('updating user account:', user.email, user.emails, newEmails);
      }
    }
  }
);
