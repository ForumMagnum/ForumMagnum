import { Accounts } from 'meteor/accounts-base';
import { isPackageTest } from '../../lib/executionEnvironment';
import { mailUrlSetting } from '../vulcan-core/start';

if (!isPackageTest) {
  Accounts.emailTemplates.siteName = 'LessWrong';
  Accounts.emailTemplates.from = 'LessWrong <no-reply@lesserwrong.com>';
  Accounts.emailTemplates.enrollAccount.subject = (user) => {
    return `Activate your Account on LessWrong`;
  };
  Accounts.emailTemplates.enrollAccount.text = (user, url) => {
    return 'You are invited to join LessWrong'
      + ' To register an account, simply click the link below:\n\n'
      + url;
  };

  Accounts.emailTemplates.resetPassword.subject = (user) => {
    return `Reset your password on LessWrong`;
  };

  Accounts.emailTemplates.resetPassword.from = () => {
    // Overrides the value set in `Accounts.emailTemplates.from` when resetting
    // passwords.
    return 'LessWrong <no-reply@lesserwrong.com>';
  };

  Accounts.emailTemplates.resetPassword.text = (user, url) => {
    return 'You\'ve requested to reset your password for LessWrong.\n\n'
      + 'To reset your password, click on the link below. The link in this email will expire within 2 days.\n \n'
      + url;
  };
  Accounts.emailTemplates.verifyEmail = {
     subject() {
        return "Verify your email address";
     },
     text(user, url) {
        return `Hey ${user.displayName}! Verify your e-mail by following this link: ${url}`;
     }
  };

  if (mailUrlSetting.get()) {
    // console.log("Set Mail URL environment variable");
    process.env.MAIL_URL = mailUrlSetting.get() || undefined;
    // console.log("Set Root URL variable");
    process.env.ROOT_URL = "https://www.lesswrong.com/";
  }
}
