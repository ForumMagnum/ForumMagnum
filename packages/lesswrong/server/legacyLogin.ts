import Users from '../lib/collections/users/collection';
import { LegacyData } from '../lib/collections/legacyData/collection';
import { addLoginAttemptValidation } from '../platform/current/server/meteorServerSideFns';
import { throwMeteorError } from '../lib/executionEnvironment';

addLoginAttemptValidation((attempt) => {
  const userStub = attempt.user || (attempt.methodArguments && attempt.methodArguments[0] && attempt.methodArguments[0].user);
  const user = userStub && Users.findOne({username: userStub.username});
  if (user && user.legacy
      && user.services
      && user.services.password
      && !attempt.allowed)
  {
    // @ts-ignore -- legacyData isn't really handled right in our schemas.
    let legacyData = user.legacyData ? user.legacyData : LegacyData.findOne({ objectId: user._id }).legacyData;
    if (legacyData && legacyData.password) {
      throwMeteorError(
        'legacy-account',
        'LessWrong 1.0 detected, legacy password salt attached ',
        {
          salt: legacyData.password.substring(0,3),
          username: user.username
        }
      )
      return false;
    }
  }
  if (!attempt.allowed) {
    return false;
  }
  if (attempt.user && attempt.user.banned && new Date(attempt.user.banned) > new Date()) {
    throwMeteorError('user-banned', 'This account is banned until ' + new Date(attempt.user.banned));
    return false;
  } else {
    return true;
  }
})
