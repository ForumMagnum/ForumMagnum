import Users from '../../lib/collections/users/collection';
import { addCallback, Utils } from '../vulcan-lib';

  //////////////////////////////////////////////////////
  // Callbacks                                        //
  //////////////////////////////////////////////////////

  // remove this to get rid of dependency on vulcan:email

  // function usersNewAdminUserCreationNotification (user) {
  //   // send notifications to admins
  //   const admins = Users.adminUsers();
  //   admins.forEach(function(admin) {
  //     if (Users.getSetting(admin, "notifications_users", false)) {
  //       const emailProperties = Users.getNotificationProperties(user);
  //       const html = VulcanEmail.getTemplate('newUser')(emailProperties);
  //       VulcanEmail.send(Users.getEmail(admin), `New user account: ${emailProperties.displayName}`, VulcanEmail.buildTemplate(html));
  //     }
  //   });
  //   return user;
  // }
  // addCallback("users.new.sync", usersNewAdminUserCreationNotification);

  export function usersMakeAdmin (user: DbUser) {
    // if this is not a dummy account, and is the first user ever, make them an admin
    // TODO: should use await Connectors.count() instead, but cannot await inside Accounts.onCreateUser. Fix later. 
    if (typeof user.isAdmin === 'undefined') {
      const realUsersCount = Users.find({}).count();
      user.isAdmin = (realUsersCount === 0);
    }
    return user;
  }
  addCallback('users.new.sync', usersMakeAdmin);

  //function usersEditGenerateHtmlBio (modifier) {
  //  if (modifier.$set && modifier.$set.bio) {
  //    modifier.$set.htmlBio = sanitize(marked(modifier.$set.bio));
  //  }
  //  return modifier;
  //}
  //addCallback('users.edit.sync', usersEditGenerateHtmlBio);

  function usersEditCheckEmail (modifier, user: DbUser) {
    // if email is being modified, update user.emails too
    if (modifier.$set && modifier.$set.email) {

      const newEmail = modifier.$set.email;

      // check for existing emails and throw error if necessary
      const userWithSameEmail = Users.findByEmail(newEmail);
      if (userWithSameEmail && userWithSameEmail._id !== user._id) {
        throw new Error(Utils.encodeIntlError({id:'users.email_already_taken', value: newEmail}));
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
  }
  addCallback('users.edit.sync', usersEditCheckEmail);

