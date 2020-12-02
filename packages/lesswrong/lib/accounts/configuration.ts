import { Accounts } from '../../platform/current/lib/meteorAccounts';

if (Accounts.config) {
  Accounts.config({
    forbidClientAccountCreation: false,
    loginExpirationInDays: 365*100,
  });
}
