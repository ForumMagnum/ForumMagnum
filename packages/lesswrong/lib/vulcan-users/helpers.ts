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

export const userFindLast = async function<N extends CollectionNameWithCreatedAt>(
  user: DbUser,
  collection: CollectionBase<N>,
  filter?: MongoSelector<ObjectsByCollectionName[N]>,
): Promise<ObjectsByCollectionName[N]|null> {
  const sortOption = { createdAt: -1 } as MongoSort<ObjectsByCollectionName[N]>
  const result = await collection.findOne(
    { ...filter, userId: user._id },
    { sort: sortOption },
  );
  return result;
};

export const userTimeSinceLast = async function<N extends CollectionNameWithCreatedAt>(
  user: DbUser,
  collection: CollectionBase<N>,
  filter?: MongoSelector<ObjectsByCollectionName[N]>,
): Promise<number> {
  var now = new Date().getTime();
  var last = await userFindLast(user, collection, filter);
  if (!last) return 999; // if this is the user's first post or comment ever, stop here
  return Math.abs(Math.floor((now - last.createdAt.getTime()) / 1000));
};

export const userNumberOfItemsInPast24Hours = async function<N extends CollectionNameWithCreatedAt>(
  user: DbUser,
  collection: CollectionBase<N>,
  filter?: MongoSelector<ObjectsByCollectionName[N]>,
): Promise<number> {
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

export const userNumberOfItemsInPastTimeframe = function<N extends CollectionNameWithCreatedAt>(
  user: DbUser,
  collection: CollectionBase<N>,
  hours: number,
  filter?: MongoSelector<ObjectsByCollectionName[N]>,
): Promise<number> {
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
