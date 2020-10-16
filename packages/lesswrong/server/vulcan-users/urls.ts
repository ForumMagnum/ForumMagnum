import { onStartup, getAbsoluteUrl } from '../../lib/executionEnvironment';
import { Accounts } from 'meteor/accounts-base';

onStartup(() => {
  if (typeof Accounts !== 'undefined') {
    Accounts.urls.resetPassword = token => getAbsoluteUrl(`reset-password/${token}`);
    Accounts.urls.enrollAccount = token => getAbsoluteUrl(`enroll-account/${token}`);
    Accounts.urls.verifyEmail = token => getAbsoluteUrl(`verify-email/${token}`);
  }
});
