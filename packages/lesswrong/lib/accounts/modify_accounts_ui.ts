import { Accounts } from '../../lib/meteorAccounts';

if (Accounts.ui) {
  Accounts.ui._options = {
    ...Accounts.ui._options,
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL',
    onPostSignUpHook: () => {},
    onSignedInHook: () => {},
  };
}
