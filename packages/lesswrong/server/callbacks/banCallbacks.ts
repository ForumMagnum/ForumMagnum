import { Accounts } from 'meteor/accounts-base';
import { Bans } from '../../lib/collections/bans/collection';
import { ForwardedWhitelist } from '../forwarded_whitelist';
import { Meteor } from 'meteor/meteor';
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
    // eslint-disable-next-line no-console
    console.warn("IP address is banned: ", attempt, attempt.connection, ban)
    return true;
  } else {
    return true;
  }
})


/* 

Uncomment this section to allow for user-impersonation, by using the
following console commands: 

Accounts.callLoginMethod({
  methodArguments: [{userId: <userId>}],
  userCallback: (err) => {console.log(err)}
});

DO NOT ACTIVATE THIS IN PRODUCTION. ONLY USE THIS IN A DEVELOPMENT CONTEXT. 

*/

// Accounts.registerLoginHandler('admin', function(loginRequest) {
//   return { userId : loginRequest.userId };
// });
