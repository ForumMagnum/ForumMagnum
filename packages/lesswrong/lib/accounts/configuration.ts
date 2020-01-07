import { Accounts } from 'meteor/accounts-base';

Accounts.config({
  forbidClientAccountCreation: false,
  loginExpirationInDays: 365*100,
});
