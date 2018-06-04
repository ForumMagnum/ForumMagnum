import { Accounts } from 'meteor/accounts-base';

Accounts.ui._options = {
  ...Accounts.ui._options,
  passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL',
  onPostSignUpHook: () => {},
  onSignedInHook: () => {},
};
