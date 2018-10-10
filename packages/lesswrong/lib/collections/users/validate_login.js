import { Accounts } from 'meteor/accounts-base';
import Users from 'meteor/vulcan:users';

Accounts.validateLoginAttempt((attempt) => {
  const userStub = attempt.user || attempt.methodArguments && attempt.methodArguments[0] && attempt.methodArguments[0].user;
  const user = userStub && Users.findOne({username: userStub.username});
  if (user && user.legacy && user.legacyData && user.legacyData.password && user.services && user.services.password && !attempt.allowed) {
    throw new Meteor.Error('legacy-account', 'LessWrong 1.0 detected, legacy password salt attached ', {salt: user.legacyData.password.substring(0,3), username: user.username})
  }
  if (!attempt.allowed) {
    return false;
  }
  if (attempt.user && attempt.user.banned && new Date(attempt.user.banned) > new Date()) {
    throw new Meteor.Error('user-banned', 'This account is banned until ' + new Date(attempt.user.banned));
  } else {
    return true;
  }
})
