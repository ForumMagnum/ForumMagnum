// import { Accounts } from '../../lib/meteorAccounts';
// import { Bans } from '../../lib/collections/bans/collection';
// import { ForwardedWhitelist } from '../forwarded_whitelist';
// // import { Meteor } from 'meteor/meteor';
// import { DatabaseServerSetting } from '../databaseSettings';

// // If set, IP bans (in the bans collection) will be enforced. Currently
// // disabled by default because this isn't adequately tested, and it would be
// // quite bad to (for example) ban the GreaterWrong IP address.
// const ipBansEnabled = new DatabaseServerSetting<boolean>('ipBansEnabled', false)

// // Check for banning at the user-account level
// Accounts.validateLoginAttempt((attempt) => {
//   if (!attempt.allowed) {
//     return false;
//   }
  
//   if (attempt.user?.banned && new Date(attempt.user.banned) > new Date()) {
//     // Triggers on login to a banned account. Currently produces an ugly-looking
//     // error message that at least works enough to tell you that the account
//     // is banned, and the end date (but which goes through a broken i18n layer
//     // that turns spaces into underscores).
//     throw new Meteor.Error('user-banned', 'This account is banned until ' + new Date(attempt.user.banned));
//   } else {
//     return true;
//   }
// })

// // Check for banning at the IP-address level
// Accounts.validateLoginAttempt((attempt) => {
//   if (!attempt.allowed) {
//     return false;
//   }
//   const ip = attempt.connection && ForwardedWhitelist.getClientIP(attempt.connection);
//   const ban = Bans.findOne({ip: ip});
//   if (ban && new Date(ban.expirationDate) > new Date()) {
//     // Triggers on login or session resume from a banned IP address.
//     const username = attempt.user.username;
//     // eslint-disable-next-line no-console
//     console.warn(`IP address is banned: IP ${ip} attempting to log in as ${username}, ban ID ${ban._id}. IP bans enforced=${ipBansEnabled.get()}`);
//     if (ipBansEnabled.get()) {
//       throw new Meteor.Error('ip-banned', 'This IP address is banned until ' + new Date(ban.expirationDate));
//     } else {
//       return true;
//     }
//   } else {
//     return true;
//   }
// })


// /* 

// Uncomment this section to allow for user-impersonation, by using the
// following console commands: 

// Accounts.callLoginMethod({
//   methodArguments: [{userId: <userId>}],
//   userCallback: (err) => {console.log(err)}
// });

// DO NOT ACTIVATE THIS IN PRODUCTION. ONLY USE THIS IN A DEVELOPMENT CONTEXT. 

// */

// // Accounts.registerLoginHandler('admin', function(loginRequest) {
// //   return { userId : loginRequest.userId };
// // });
