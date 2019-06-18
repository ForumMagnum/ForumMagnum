import Messages from './collections/messages/collection.js';
import Conversations from './collections/conversations/collection.js';
import Users from 'meteor/vulcan:users';
import { Utils, getCollection } from 'meteor/vulcan:core';


/**
* @summary Get relative link to conversation (used only in session)
* @param {Object} conversation
**/
Conversations.getLink = (conversation) => {
  return `/inbox/${conversation._id}`;
};

/**
* @summary Get relative link to conversation of message (conversations are only linked to relatively)
* @param {Object} message
**/
Messages.getLink = (message) => {
  return `/inbox/${message.conversationId}`;
};

/**
* @summary Check whether User is subscribed to a document
* @param {Object} user
* @param {Object} document
**/
Users.isSubscribedTo = (user, document) => {
  if (!user || !document) {
    // should return an error
    return false;
  }

  const { __typename, _id: itemId } = document;
  const documentType = Utils.capitalize(Utils.getCollectionNameFromTypename(__typename));

  if (user.subscribedItems && user.subscribedItems[documentType]) {
    return !!user.subscribedItems[documentType].find(subscribedItems => subscribedItems.itemId === itemId);
  } else {
    return false;
  }
};

// LESSWRONG version of getting unused slug. Modified to also include "oldSlugs" array
Utils.getUnusedSlug = function (collection, slug, useOldSlugs = false) {
  let suffix = '';
  let index = 0;

  // test if slug is already in use
  while (!!collection.findOne(useOldSlugs ? {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]} : {slug: slug+suffix})) {
    index++
    suffix = '-'+index;
  }

  return slug+suffix;
};

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
Utils.getUnusedSlugByCollectionName = function (collectionName, slug, useOldSlugs = false) {
  return Utils.getUnusedSlug(getCollection(collectionName), slug, useOldSlugs)
};

Utils.slugIsUsed = async (collectionName, slug) => {
  const collection = getCollection(collectionName)
  const existingUserWithSlug = await collection.findOne({$or: [{slug: slug},{oldSlugs: slug}]})
  return !!existingUserWithSlug
}
