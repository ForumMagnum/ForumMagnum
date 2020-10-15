import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { mailUrlSetting } from '../vulcan-core/start';

if (!Meteor.isPackageTest) {
  Accounts.emailTemplates.siteName = 'EA Forum Internal Beta';
  Accounts.emailTemplates.from = 'The Forum Team <forum@effectivealtruism.org>';
  Accounts.emailTemplates.enrollAccount.subject = (user) => {
    return 'Activate your Account on the EA Forum Internal Beta';
  };
  Accounts.emailTemplates.enrollAccount.text = (user, url) => {
    return 'You are invited to participate in the EA Forum'
      + ' To register an account, simply click the link below:\n\n'
      + url;
  };

  Accounts.emailTemplates.resetPassword.subject = (user) => {
    return 'Reset your password on the EA Forum';
  };

  Accounts.emailTemplates.resetPassword.from = () => {
    // Overrides the value set in `Accounts.emailTemplates.from` when resetting
    // passwords.
    return 'The Forum Team <forum@effectivealtruism.org>';
  };

  // TODO change these
  Accounts.emailTemplates.resetPassword.text = (user, url) => {
    return 'You\'ve requested to reset your password for the EA Forum. \n\n'
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
