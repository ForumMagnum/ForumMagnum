import { Accounts } from 'meteor/accounts-base';
import { getSetting } from 'meteor/vulcan:core';
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

function getWhitelist () {
  const rawSetting = getSetting('privateBetaLegacyWhitelist')
  if (!rawSetting) return []
  return Object.values(rawSetting)
}

const whitelist = getWhitelist()

// EA Forum Power User Beta
// Reject legacy users unless they're on the whitelist
Accounts.validateLoginAttempt((attempt) => {
  const userStub = attempt.user || attempt.methodArguments && attempt.methodArguments[0] && attempt.methodArguments[0].user;
  const user = userStub && Users.findOne({username: userStub.username});
  if (!user) {
    return true
  }
  if (whitelist.includes(user.username)) {
    return true
  }
  if (user && user.legacy) {
    throw new Meteor.Error('legacy-not-yet-ready', 'Legacy user detected, not yet allowed')
  }
  return true
})
