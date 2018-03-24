import { Accounts } from 'meteor/accounts-base';
import Bans from './collection.js';
import { ForwardedWhitelist } from '../../modules/forwarded_whitelist.js';
// Check during login whether the user currently has their login disabled


// User ban callback

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

Accounts.validateLoginAttempt((attempt) => {
  if (!attempt.allowed) {
    return false;
  }
  const ban = Bans.findOne({ip: attempt.connection && ForwardedWhitelist.getClientIP(attempt.connection)});
  if (ban && new Date(ban.expirationDate) > new Date()) {
    throw new Meteor.Error('address-banned', 'Your ip-address is banned until ' + new Date(ban.expirationDate) + ' for ' + ban.reason);
  } else {
    return true;
  }
})
