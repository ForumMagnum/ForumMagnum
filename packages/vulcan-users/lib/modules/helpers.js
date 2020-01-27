import { Utils } from 'meteor/vulcan:lib';
import Users from './collection.js';
import moment from 'moment';

////////////////////
//  User Getters  //
////////////////////

/**
 * @summary Get a user
 * @param {String} userOrUserId
 */
Users.getUser = function(userOrUserId) {
  if (typeof userOrUserId === 'undefined') {
    if (!Meteor.user()) {
      throw new Error();
    } else {
      return Meteor.user();
    }
  } else if (typeof userOrUserId === 'string') {
    return Users.findOne(userOrUserId);
  } else {
    return userOrUserId;
  }
};

/**
 * @summary Get a user's username (unique, no special characters or spaces)
 * @param {Object} user
 */
Users.getUserName = function(user) {
  try {
    if (user?.username) return user.username;
    if (user?.services?.twitter?.screenName)
      return user?.services?.twitter?.screenName;
  } catch (error) {
    console.log(error); // eslint-disable-line
    return null;
  }
};

/**
 * @summary Get a user's display name (not unique, can take special characters and spaces)
 * @param {Object} user
 */
Users.getDisplayName = function(user) {
  if (!user) {
    return '';
  } else {
    return user.displayName ? user.displayName : Users.getUserName(user);
  }
};
Users.getDisplayNameById = function(userId) {
  return Users.getDisplayName(Users.findOne(userId));
};
export const getDisplayName = Users.getDisplayName;

/**
 * @summary Get a user's profile URL
 * @param {Object} user (note: we only actually need either the _id or slug properties)
 * @param {Boolean} isAbsolute
 */
Users.getProfileUrl = function(user, isAbsolute) {
  if (typeof user === 'undefined') {
    return '';
  }
  isAbsolute = typeof isAbsolute === 'undefined' ? false : isAbsolute; // default to false
  var prefix = isAbsolute ? Utils.getSiteUrl().slice(0, -1) : '';
  if (user.slug) {
    return `${prefix}/users/${user.slug}`;
  } else {
    return '';
  }
};
export const getProfileUrl = Users.getProfileUrl;

/**
 * @summary Get a user's account edit URL
 * @param {Object} user (note: we only actually need either the _id or slug properties)
 * @param {Boolean} isAbsolute
 */
Users.getEditUrl = function(user, isAbsolute) {
  return `${Users.getProfileUrl(user, isAbsolute)}/edit`;
};

/**
 * @summary Get a user's Twitter name
 * @param {Object} user
 */
Users.getTwitterName = function(user) {
  // return twitter name provided by user, or else the one used for twitter login
  if (typeof user !== 'undefined') {
    if (user.twitterUsername) {
      return user.twitterUsername;
    } else if (Utils.checkNested(user, 'services', 'twitter', 'screenName')) {
      return user.services.twitter.screenName;
    }
  }
  return null;
};

/**
 * @summary Get a user's GitHub name
 * @param {Object} user
 */
Users.getGitHubName = function(user) {
  // return twitter name provided by user, or else the one used for twitter login
  if (Utils.checkNested(user, 'profile', 'github')) {
    return user.profile.github;
  } else if (Utils.checkNested(user, 'services', 'github', 'screenName')) {
    // TODO: double-check this with GitHub login
    return user.services.github.screenName;
  }
  return null;
};
/**
 * @summary Get a user's email
 * @param {Object} user
 */
Users.getEmail = function(user) {
  if (user.email) {
    return user.email;
  } else {
    return null;
  }
};

////////////////////
//  User Checks   //
////////////////////

///////////////////
// Other Helpers //
///////////////////

Users.findLast = function(user, collection) {
  return collection.findOne({ userId: user._id }, { sort: { createdAt: -1 } });
};

Users.timeSinceLast = function(user, collection) {
  var now = new Date().getTime();
  var last = this.findLast(user, collection);
  if (!last) return 999; // if this is the user's first post or comment ever, stop here
  return Math.abs(Math.floor((now - last.createdAt) / 1000));
};

Users.numberOfItemsInPast24Hours = function(user, collection) {
  var mNow = moment();
  var items = collection.find({
    userId: user._id,
    createdAt: {
      $gte: mNow.subtract(24, 'hours').toDate(),
    },
  });
  return items.count();
};

////////////////////
// More Helpers   //
////////////////////

// helpers that don't take a user as argument

Users.findByEmail = function(email) {
  return Users.findOne({ email: email });
};
