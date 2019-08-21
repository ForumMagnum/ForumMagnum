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
Utils.getUnusedSlug = function (collection, slug, useOldSlugs = false, documentId) {
  let suffix = '';
  let index = 0;
  
  let existingDocuments = getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
  // test if slug is already in use
  while (!!existingDocuments?.length) {
    // Filter out our own document (i.e. don't change the slug if the only conflict is with ourselves)
    const conflictingDocuments = existingDocuments.filter((doc) => doc._id !== documentId)
    // If there are other documents we conflict with, change the index and slug, then check again
    if (!!conflictingDocuments?.length) {
      index++
      suffix = '-'+index;
      existingDocuments = getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
    } else {
      break
    }
  }
  return slug+suffix;
};

const getDocumentsBySlug = ({slug, suffix, useOldSlugs,  collection}) => {
  return collection.find(useOldSlugs ? 
    {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]} : 
    {slug: slug+suffix}
  ).fetch()
}

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
Utils.getUnusedSlugByCollectionName = function (collectionName, slug, useOldSlugs = false, documentId) {
  return Utils.getUnusedSlug(getCollection(collectionName), slug, useOldSlugs, documentId)
};

Utils.slugIsUsed = async (collectionName, slug) => {
  const collection = getCollection(collectionName)
  const existingUserWithSlug = await collection.findOne({$or: [{slug: slug},{oldSlugs: slug}]})
  return !!existingUserWithSlug
}
