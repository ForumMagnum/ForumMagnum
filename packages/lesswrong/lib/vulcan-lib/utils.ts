/*

Utilities

*/

import urlObject from 'url';
import getSlug from 'speakingurl';
import { getSetting, registerSetting } from './settings';
import { getCollection } from './getCollection';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import * as _ from 'underscore';
import { Meteor } from 'meteor/meteor';

registerSetting('debug', false, 'Enable debug mode (more verbose logging)');

/**
 * @summary The global namespace for Vulcan utils.
 * @namespace Telescope.utils
 */
export const Utils: any = {};

/**
 * @summary Convert a camelCase string to a space-separated capitalized string
 * See http://stackoverflow.com/questions/4149276/javascript-camelcase-to-regular-form
 * @param {String} str
 */
Utils.camelToSpaces = function (str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
};

/**
 * @summary Convert a dash separated string to camelCase.
 * @param {String} str
 */
Utils.dashToCamel = function (str) {
  return str.replace(/(-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

/**
 * @summary Convert a string to camelCase and remove spaces.
 * @param {String} str
 */
Utils.camelCaseify = function(str) {
  str = this.dashToCamel(str.replace(' ', '-'));
  str = str.slice(0,1).toLowerCase() + str.slice(1);
  return str;
};

/**
 * @summary Capitalize a string.
 * @param {String} str
 */
Utils.capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

//////////////////////////
// URL Helper Functions //
//////////////////////////

/**
 * @summary Returns the user defined site URL or Meteor.absoluteUrl. Add trailing '/' if missing
 */
Utils.getSiteUrl = function () {
  let url = getSetting('siteUrl', Meteor.absoluteUrl());
  if (url.slice(-1) !== '/') {
    url += '/';
  }
  return url;
};

/**
 * @summary The global namespace for Vulcan utils.
 * @param {String} url - the URL to redirect
 */
Utils.getOutgoingUrl = function (url) {
  return Utils.getSiteUrl() + 'out?url=' + encodeURIComponent(url);
};

Utils.slugify = function (s) {
  var slug = getSlug(s, {
    truncate: 60
  });

  // can't have posts with an "edit" slug
  if (slug === 'edit') {
    slug = 'edit-1';
  }

  // If there is nothing in the string that can be slugified, just call it unicode
  if (slug === "") {
    slug = "unicode"
  }

  return slug;
};
Utils.getUnusedSlug = function (collection, slug) {
  let suffix = '';
  let index = 0;

  // test if slug is already in use
  while (!!collection.findOne({slug: slug+suffix})) {
    index++;
    suffix = '-'+index;
  }

  return slug+suffix;
};

Utils.getUnusedSlugByCollectionName = function (collectionName, slug) {
  return Utils.getUnusedSlug(getCollection(collectionName), slug);
};

Utils.getDomain = function(url) {
  try {
    const hostname = urlObject.parse(url).hostname
    return hostname!.replace('www.', '');
  } catch (error) {
    return null;
  }
};

// add http: if missing
Utils.addHttp = function (url) {
  try {
    if (url.substring(0, 5) !== 'http:' && url.substring(0, 6) !== 'https:') {
      url = 'http:'+url;
    }
    return url;
  } catch (error) {
    return null;
  }
};

/////////////////////////////
// String Helper Functions //
/////////////////////////////

// http://stackoverflow.com/questions/2631001/javascript-test-for-existence-of-nested-object-key
Utils.checkNested = function(obj /*, level1, level2, ... levelN*/) {
  var args = Array.prototype.slice.call(arguments);
  obj = args.shift();

  for (var i = 0; i < args.length; i++) {
    if (!obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
};

// see http://stackoverflow.com/questions/8051975/access-object-child-properties-using-a-dot-notation-string
Utils.getNestedProperty = function (obj, desc) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

Utils.getLogoUrl = () => {
  const logoUrl = getSetting<string|null>('logoUrl');
  if (logoUrl) {
    const prefix = Utils.getSiteUrl().slice(0,-1);
    // the logo may be hosted on another website
    return logoUrl.indexOf('://') > -1 ? logoUrl : prefix + logoUrl;
  }
};

// note(apollo): get collection's name from __typename given by react-apollo
Utils.getCollectionNameFromTypename = (type) => {
  if (type.indexOf('Post') > -1) {
    return 'posts';
  } else if (type.indexOf('Cat') > -1) {
    return 'categories';
  } else if (type.indexOf('User') > -1) {
    return 'users';
  } else if (type.indexOf('Comment') > -1) {
    return 'comments';
  } else if (type.indexOf('Localgroup') > -1) {
    return 'localgroups';
  }
};

/**
 * Convert an array of field names into a Mongo fields specifier
 * @param {Array} fieldsArray
 */
Utils.arrayToFields = (fieldsArray) => {
  return _.object(fieldsArray, _.map(fieldsArray, function () {return true;}));
};

Utils.encodeIntlError = error => typeof error !== 'object' ? error : JSON.stringify(error);

Utils.decodeIntlError = (error, options = {stripped: false}) => {
  try {
    // do we get the error as a string or as an error object?
    let strippedError = typeof error === 'string' ? error : error.message;

    // if the error hasn't been cleaned before (ex: it's not an error from a form)
    if (!options.stripped) {
      // strip the "GraphQL Error: message [error_code]" given by Apollo if present
      const graphqlPrefixIsPresent = strippedError.match(/GraphQL error: (.*)/);
      if (graphqlPrefixIsPresent) {
        strippedError = graphqlPrefixIsPresent[1];
      }

      // strip the error code if present
      const errorCodeIsPresent = strippedError.match(/(.*)\[(.*)\]/);
      if (errorCodeIsPresent) {
        strippedError = errorCodeIsPresent[1];
      }
    }

    // the error is an object internationalizable
    const parsedError = JSON.parse(strippedError);

    // check if the error has at least an 'id' expected by react-intl
    if (!parsedError.id) {
      console.error('[Undecodable error]', error); // eslint-disable-line
      return {id: 'app.something_bad_happened', value: '[undecodable error]'};
    }

    // return the parsed error
    return parsedError;
  } catch(__) {
    // the error is not internationalizable
    return error;
  }
};

Utils.findWhere = (array, criteria) => array.find(item => Object.keys(criteria).every(key => item[key] === criteria[key]));

Utils.isPromise = value => isFunction(get(value, 'then'));

Utils.pluralize = s => {
  const plural = s.slice(-1) === 'y' ?
    `${s.slice(0, -1)}ies` :
    s.slice(-1) === 's' ?
      `${s}es` :
      `${s}s`;
  return plural;
};

Utils.removeProperty = (obj, propertyName) => {
  for(const prop in obj) {
    if (prop === propertyName){
      delete obj[prop];
    } else if (typeof obj[prop] === 'object') {
      Utils.removeProperty(obj[prop], propertyName);
    }
  }
};
