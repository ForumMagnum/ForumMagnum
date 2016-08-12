import Telescope from 'nova-lib';
import MailChimpList from './mailchimp/mailchimp_list.js';
import Users from 'nova-users';

function subscribeUserOnProfileCompletion (user) {
  if (!!Telescope.settings.get('autoSubscribe') && !!Users.getEmail(user)) {
    MailChimpList.add(user, false, function (error, result) {
      console.log(error);
      console.log(result);
    });
  }
  return user;
}
Telescope.callbacks.add("profileCompletedAsync", subscribeUserOnProfileCompletion);