import Users from '../../lib/collections/users/collection';
import { encodeIntlError } from '../../lib/vulcan-lib/utils';
import { getCollectionHooks } from '../mutationCallbacks';
import { userFindByEmail } from '../../lib/vulcan-users/helpers';

getCollectionHooks("Users").newSync.add(function usersMakeAdmin (user: DbUser) {
    // if this is not a dummy account, and is the first user ever, make them an admin
    // TODO: should use await Connectors.count() instead, but cannot await inside Accounts.onCreateUser. Fix later. 
    if (typeof user.isAdmin === 'undefined') {
      const realUsersCount = Users.find({}).count();
      user.isAdmin = (realUsersCount === 0);
    }
    return user;
});

getCollectionHooks("Users").editSync.add(function usersEditCheckEmail (modifier, user: DbUser) {
    // if email is being modified, update user.emails too
    if (modifier.$set && modifier.$set.email) {

      const newEmail = modifier.$set.email;

      // check for existing emails and throw error if necessary
      const userWithSameEmail = userFindByEmail(newEmail);
      if (userWithSameEmail && userWithSameEmail._id !== user._id) {
        throw new Error(encodeIntlError({id:'users.email_already_taken', value: newEmail}));
      }

      // if user.emails exists, change it too
      if (!!user.emails) {
        if (user.emails[0].address !== newEmail) {
          user.emails[0].address = newEmail;
          user.emails[0].verified = false;
          modifier.$set.emails = user.emails;
        }
      } else {
        modifier.$set.emails = [{address: newEmail, verified: false}];
      }
    }
    return modifier;
});

