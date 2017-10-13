import { Accounts } from 'meteor/accounts-base';

// Check during login whether the user currently has their login disabled

Accounts.validateLoginAttempt((attempt) => {
  if (!attempt.allowed) {
    return false;
  }
  if (attempt.user && attempt.user.banned && new Date(attempt.user.banned) > new Date()) {
    throw new Meteor.Error('user-banned', 'This account is banned until ' + new Date(attempt.user.banned));
  } else {
    return true;
  }
})
