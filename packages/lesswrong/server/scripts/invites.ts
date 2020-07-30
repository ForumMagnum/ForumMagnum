import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { mailUrlSetting } from '../vulcan-core/start';

if (!Meteor.isPackageTest) {
  Accounts.emailTemplates.siteName = 'LessWrong 2.0';
  Accounts.emailTemplates.from = 'LessWrong 2.0 <no-reply@lesserwrong.com>';
  Accounts.emailTemplates.enrollAccount.subject = (user) => {
    return `Activate your Account on LessWrong 2.0`;
  };
  Accounts.emailTemplates.enrollAccount.text = (user, url) => {
    return 'You are invited to join LessWrong 2.0'
      + ' To register an account, simply click the link below:\n\n'
      + url;
  };

  Accounts.emailTemplates.resetPassword.subject = (user) => {
    return `Reset your password on LessWrong 2.0`;
  };

  Accounts.emailTemplates.resetPassword.from = () => {
    // Overrides the value set in `Accounts.emailTemplates.from` when resetting
    // passwords.
    return 'LessWrong 2.0 <no-reply@lesserwrong.com>';
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
    process.env.ROOT_URL = "http://www.lesswrong.com/";
  }
}
