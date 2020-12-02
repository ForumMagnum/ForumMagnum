import { Accounts } from '../../lib/meteorAccounts';

if (Accounts.config) {
  Accounts.config({
    forbidClientAccountCreation: false,
    loginExpirationInDays: 365*100,
  });
}
