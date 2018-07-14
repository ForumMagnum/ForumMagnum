import { Accounts } from 'meteor/accounts-base';
import { getSetting } from 'meteor/vulcan:lib';

if (!Meteor.isPackageTest) {
  Accounts.emailTemplates.siteName = 'EA Forum Internal Beta';
  Accounts.emailTemplates.from = 'The Forum Team <jp+forum-3@centreforeffectivealtruism.org>';
  Accounts.emailTemplates.enrollAccount.subject = (user) => {
    return 'Activate your Account on the EA Forum Internal Beta';
  };
  Accounts.emailTemplates.enrollAccount.text = (user, url) => {
    return 'You are invited to participate in the EA Forum Internal Beta'
      + ' To register an account, simply click the link below:\n\n'
      + url;
  };

  Accounts.emailTemplates.resetPassword.subject = (user) => {
    return 'Reset your password on the EA Forum Internal Beta';
  };

  Accounts.emailTemplates.resetPassword.from = () => {
    // Overrides the value set in `Accounts.emailTemplates.from` when resetting
    // passwords.
    return 'The Forum Team <jp+forum-2@centreforeffectivealtruism.org>';
  };

  // TODO change these
  Accounts.emailTemplates.resetPassword.text = (user, url) => {
    return 'You\'ve requested to reset your password for the EA Forum Internal Beta. \n\n'
      + 'To reset your password, click on the link below. The link in this email will expire within 2 days.\n \n'
      + url;
  };
  Accounts.emailTemplates.verifyEmail = {
     subject() {
        return "Activate your EA Forum Account";
     },
     text(user, url) {
        return `Hey ${user}! Verify your e-mail by following this link: ${url}`;
     }
  };

  if (getSetting('mailUrl')) {
    // console.log("Set Mail URL environment variable");
    process.env.MAIL_URL = getSetting('mailUrl');
    // console.log("Set Root URL variable");
    // TODO what's this used for
    process.env.ROOT_URL = "http://www.lesswrong.com/";
  }
}
