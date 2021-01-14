import { checkNested } from '../vulcan-lib/utils';
import { mongoFindOne } from '../mongoQueries';
import { userGetDisplayName, userGetProfileUrl } from '../collections/users/helpers';
import moment from 'moment';
import { meteorCurrentUserFromFiberContext } from '../meteorAccounts';

// Get a user
export const getUser = function(userOrUserId: DbUser|string|undefined): DbUser|null {
  if (typeof userOrUserId === 'undefined') {
    if (!meteorCurrentUserFromFiberContext()) {
      throw new Error();
    } else {
      return meteorCurrentUserFromFiberContext();
    }
  } else if (typeof userOrUserId === 'string') {
    return mongoFindOne("Users", userOrUserId);
  } else {
    return userOrUserId;
  }
};

export const userGetDisplayNameById = function(userId: string): string {
  return userGetDisplayName(mongoFindOne("Users", userId));
};

// Get a user's account edit URL
// @param {Object} user (note: we only actually need either the _id or slug properties)
// @param {Boolean} isAbsolute
export const userGetEditUrl = function(user: DbUser|UsersMinimumInfo|null, isAbsolute=false): string {
  return `${userGetProfileUrl(user, isAbsolute)}/edit`;
};

// Get a user's GitHub name
export const userGetGitHubName = function(user: DbUser): string|null {
  // return twitter name provided by user, or else the one used for twitter login
  if (checkNested(user, 'profile', 'github')) {
    return user.profile.github;
  } else if (checkNested(user, 'services', 'github', 'screenName')) {
    // TODO: double-check this with GitHub login
    return user.services.github.screenName;
  }
  return null;
};

// Get a user's email
export const userGetEmail = function(user: DbUser): string|null {
  if (user.email) {
    return user.email;
  } else {
    return null;
  }
};

export const userFindLast = function<T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any): T|null {
  return collection.findOne({ ...filter, userId: user._id }, { sort: { createdAt: -1 } });
};

export const userTimeSinceLast = function<T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any): number {
  var now = new Date().getTime();
  var last = userFindLast(user, collection, filter);
  if (!last) return 999; // if this is the user's first post or comment ever, stop here
  return Math.abs(Math.floor((now - last.createdAt.getTime()) / 1000));
};

export const userNumberOfItemsInPast24Hours = function<T extends DbObject>(user: DbUser, collection: CollectionBase<T>, filter?: Record<string,any>): number {
  var mNow = moment();
  var items = collection.find({
    userId: user._id,
    ...filter,
    createdAt: {
      $gte: mNow.subtract(24, 'hours').toDate(),
    },
  });
  return items.count();
};

export const userFindByEmail = function(email: string): DbUser|null {
  return mongoFindOne("Users", { email: email });
};
