import { Meteor } from 'meteor/meteor';
import { onStartup } from '../../lib/executionEnvironment';
import { Accounts } from 'meteor/accounts-base';

onStartup(() => {
  if (typeof Accounts !== 'undefined') {
    Accounts.urls.resetPassword = token => Meteor.absoluteUrl(`reset-password/${token}`);
    Accounts.urls.enrollAccount = token => Meteor.absoluteUrl(`enroll-account/${token}`);
    Accounts.urls.verifyEmail = token => Meteor.absoluteUrl(`verify-email/${token}`);
  }
});
