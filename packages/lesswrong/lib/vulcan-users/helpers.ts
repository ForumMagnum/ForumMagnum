import { checkNested } from '../vulcan-lib/utils';
import { mongoFindOne } from '../mongoQueries';
import { userGetDisplayName, userGetProfileUrl } from '../collections/users/helpers';
import moment from 'moment';

// Get a user
export const getUser = async function(userOrUserId: DbUser|string|undefined): Promise<DbUser|null> {
  if (typeof userOrUserId === 'undefined') {
    throw new Error();
  } else if (typeof userOrUserId === 'string') {
    return await mongoFindOne("Users", userOrUserId);
  } else {
    return userOrUserId;
  }
};

export const userGetDisplayNameById = async function(userId: string): Promise<string> {
  return userGetDisplayName(await mongoFindOne("Users", userId));
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

export const userFindLast = async function<T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any): Promise<T|null> {
  return await collection.findOne({ ...filter, userId: user._id }, { sort: { createdAt: -1 } });
};

export const userTimeSinceLast = async function<T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any): Promise<number> {
  var now = new Date().getTime();
  var last = await userFindLast(user, collection, filter);
  if (!last) return 999; // if this is the user's first post or comment ever, stop here
  return Math.abs(Math.floor((now - last.createdAt.getTime()) / 1000));
};

export const userNumberOfItemsInPast24Hours = async function<T extends DbObject>(user: DbUser, collection: CollectionBase<T>, filter?: Record<string,any>): Promise<number> {
  var mNow = moment();
  var items = collection.find({
    userId: user._id,
    ...filter,
    createdAt: {
      $gte: mNow.subtract(24, 'hours').toDate(),
    },
  });
  return await items.count();
};

export const getUserItemsInPastTimeframe = async function <T extends DbObject> ({user, collection, hours, filter, sortBy}:{user: DbUser, collection: CollectionBase<T>, hours: number, filter?: MongoSelector<T>, sortBy?: MongoSort<T>}):Promise<Array<T>> {
  var mNow = moment();
  var items = await collection.find({
    userId: user._id,
    ...filter,
    createdAt: {
      $gte: mNow.subtract(hours, 'hours').toDate(),
    },
  }, {sort:sortBy}).fetch();
  return items
};


export const userNumberOfItemsInPastTimeframe = function<T extends DbObject>(user: DbUser, collection: CollectionBase<T>, hours: number, filter?: MongoSelector<T>): Promise<number> {
  var mNow = moment();
  var items = collection.find({
    userId: user._id,
    ...filter,
    createdAt: {
      $gte: mNow.subtract(hours, 'hours').toDate(),
    },
  });
  return items.count();
};
