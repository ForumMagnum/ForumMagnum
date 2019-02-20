import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
import Sequences from '../../lib/collections/sequences/collection.js';
import algoliasearch from 'algoliasearch';
import { getSetting } from 'meteor/vulcan:core';
import htmlToText from 'html-to-text';
import { dataToMarkdown } from '../editor/make_editable_callbacks'
import '../../lib/algoliaIndexNames.js';

const COMMENT_MAX_SEARCH_CHARACTERS = 2000

Comments.toAlgolia = (comment) => {
  if (comment.deleted) return null;
  
  const algoliaComment = {
    objectID: comment._id,
    _id: comment._id,
    userId: comment.userId,
    baseScore: comment.baseScore,
    score: comment.score,
    isDeleted: comment.isDeleted,
    retracted: comment.retracted,
    deleted: comment.deleted,
    spam: comment.spam,
    legacy: comment.legacy,
    userIP: comment.userIP,
    createdAt: comment.createdAt,
    postedAt: comment.postedAt,
    af: comment.af
  };
  const commentAuthor = Users.findOne({_id: comment.userId});
  if (commentAuthor && !commentAuthor.deleted) {
    algoliaComment.authorDisplayName = commentAuthor.displayName;
    algoliaComment.authorUserName = commentAuthor.username;
    algoliaComment.authorSlug = commentAuthor.slug;
  }
  const parentPost = Posts.findOne({_id: comment.postId});
  if (parentPost) {
    algoliaComment.postId = comment.postId;
    algoliaComment.postTitle = parentPost.title;
    algoliaComment.postSlug = parentPost.slug;
  }
  let body = ""
  if (comment.contents && comment.contents.originalContents && comment.contents.originalContents.type) {
    const { data, type } = comment.contents.originalContents
    body = dataToMarkdown(data, type)
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  //  TODO: Actually limit by encoding size as opposed to characters
  algoliaComment.body = body.slice(0, COMMENT_MAX_SEARCH_CHARACTERS)
  return [algoliaComment]
}

Sequences.toAlgolia = (sequence) => {
  const algoliaSequence = {
    objectID: sequence._id,
    _id: sequence._id,
    title: sequence.title,
    userId: sequence.userId,
    baseScore: sequence.baseScore,
    score: sequence.score,
    isDeleted: sequence.isDeleted,
    createdAt: sequence.createdAt,
    postedAt: sequence.postedAt,
    af: sequence.af
  };
  const sequenceAuthor = Users.findOne({_id: sequence.userId});
  if (sequenceAuthor) {
    algoliaSequence.authorDisplayName = sequenceAuthor.displayName;
    algoliaSequence.authorUserName = sequenceAuthor.username;
    algoliaSequence.authorSlug = sequenceAuthor.slug;
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  // TODO: Actually limit by encoding size as opposed to characters
  const { html = "" } = sequence.contents || {};
  const plaintextBody = htmlToText.fromString(html);
  algoliaSequence.plaintextDescription = plaintextBody.slice(0, 2000);
  return [algoliaSequence]
}

Users.toAlgolia = (user) => {
  if (user.deleted) return null;
  
  const algoliaUser = {
    objectID: user._id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
    bio: user.bio,
    karma: user.karma,
    slug: user.slug,
    website: user.website,
    groups: user.groups,
    af: user.groups && user.groups.includes('alignmentForum')
  }
  return [algoliaUser];
}

// TODO: Refactor this to no longer by this insane parallel code path, and instead just make a graphQL query and use all the relevant data
Posts.toAlgolia = (post) => {
  if (post.draft) return null;
  if (post.deleted) return null;
  if (post.status !== Posts.config.STATUS_APPROVED) return null;
  
  const algoliaMetaInfo = {
    _id: post._id,
    userId: post.userId,
    url: post.url,
    title: post.title,
    slug: post.slug,
    baseScore: post.baseScore,
    score: post.score,
    status: post.status,
    legacy: post.legacy,
    commentCount: post.commentCount,
    userIP: post.userIP,
    createdAt: post.createdAt,
    postedAt: post.postedAt,
    isFuture: post.isFuture,
    viewCount: post.viewCount,
    lastCommentedAt: post.lastCommentedAt,
    draft: post.draft,
    af: post.af
  };
  const postAuthor = Users.findOne({_id: post.userId});
  if (postAuthor && !postAuthor.deleted) {
    algoliaMetaInfo.authorSlug = postAuthor.slug;
    algoliaMetaInfo.authorDisplayName = postAuthor.displayName;
    algoliaMetaInfo.authorFullName = postAuthor.fullName;
  }
  const postFeed = RSSFeeds.findOne({_id: post.feedId});
  if (postFeed) {
    algoliaMetaInfo.feedName = postFeed.nickname;
    algoliaMetaInfo.feedLink = post.feedLink;
  }
  let postBatch = [];
  let body = ""
  if (post.contents && post.contents.originalContents && post.contents.originalContents.type) {
    const { data, type } = post.contents.originalContents
    body = dataToMarkdown(data, type)
  }
  if (body) {
    body.split("\n\n").forEach((paragraph, paragraphCounter) => {
      postBatch.push(_.clone({
        ...algoliaMetaInfo,
        objectID: post._id + "_" + paragraphCounter,
        body: paragraph,
      }));
    })
  } else {
    postBatch.push(_.clone(algoliaMetaInfo));
  }
  return postBatch;
}

// Do algoliaIndex.waitTask as an async function rather than a
// callback-accepting function.
async function algoliaWaitForTask(algoliaIndex, taskID) {
  return new Promise((resolve,reject) => {
    algoliaIndex.waitTask(taskID, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Do algoliaIndex.addObjects as an async function rather than a
// callback-accepting function. Returns a content object with a taskID
// and a list objectIDs.
//
// https://www.algolia.com/doc/api-reference/api-methods/add-objects/
async function algoliaAddObjects(algoliaIndex, objects) {
  return new Promise((resolve,reject) => {
    algoliaIndex.addObjects(objects, (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

// Do algoliaIndex.deleteObjects as an async function rather than a
// callback-accepting function. Returns a content object with a taskID
// and a list objectIDs.
// https://www.algolia.com/doc/api-reference/api-methods/delete-objects/
export async function algoliaDeleteIds(algoliaIndex, ids)
{
  return new Promise((resolve,reject) => {
    algoliaIndex.deleteObjects(ids, (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

// Do algoliaIndex.getObjects as an async function rather than a
// callback-accepting function. Returns a content object with a results field.
// https://www.algolia.com/doc/api-reference/api-methods/get-objects/
async function algoliaGetObjects(algoliaIndex, ids)
{
  return new Promise((resolve,reject) => {
    algoliaIndex.getObjects(ids, (err,content) => {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

export async function algoliaDoSearch(algoliaIndex, query) {
  return new Promise((resolve,reject) => {
    algoliaIndex.search(query, (err,content) => {
      if (err) reject(err);
      else resolve(content);
    });
  });
}


// Given a list of objects that should be in the Algolia index, check whether
// they are, and whether all fields on them match. If there are any differences,
// correct them.
//
// (We do this rather than add blindly, because addObjects called are expensive
// -- both in the traditional performance sense, and also in the sense that
// Algolia's usage-based billing is built around it.)
async function addOrUpdateIfNeeded(algoliaIndex, objects) {
  let ids = _.map(objects, o=>o._id);
  let algoliaObjects = await algoliaGetObjects(algoliaIndex, ids);
  let algoliaObjectsById = _.keyBy(algoliaObjects, o=>o._id);
  
  let objectsToSync = _.filter(objects,
    obj => !_.isEqual(obj, algoliaObjectsById[obj._id]));
  
  if (objectsToSync.length > 0) {
    let response = await algoliaAddObjects(algoliaIndex, objectsToSync);
    await algoliaWaitForTask(algoliaIndex, response.taskID);
  }
}

// Given a list of IDs that should *not* be in the Algolia index, check whether
// any are, and (if any are), delete them.
async function deleteIfPresent(algoliaIndex, ids) {
  let algoliaObjects = await algoliaGetObjects(algoliaIndex, ids);
  let algoliaObjectsById = _.keyBy(algoliaObjects, o=>o._id);
  let idsToDelete = _.filter(ids, id => id in algoliaObjectsById);
  
  if (idsToDelete.length > 0) {
    let response = await algoliaDeleteIds(algoliaIndex, idsToDelete);
    await algoliaWaitForTask(algoliaIndex, response.taskID);
  }
}


export function getAlgoliaAdminClient()
{
  const algoliaAppId = getSetting('algolia.appId');
  const algoliaAdminKey = getSetting('algolia.adminKey');
  
  if (!algoliaAppId || !algoliaAdminKey) {
    if (!Meteor.isTest && !Meteor.isAppTest && !Meteor.isPackageTest) {
      //eslint-disable-next-line no-console
      console.info("No Algolia credentials found. To activate search please provide 'algolia.appId' and 'algolia.adminKey' in the settings")
    }
    return null;
  }
  
  let client = algoliasearch(algoliaAppId, algoliaAdminKey);
  return client;
}

export async function algoliaDocumentExport({ documents, collection, updateFunction} ) {
  // if (Meteor.isDevelopment) {  // Only run document export in production environment
  //   return null
  // }
  let client = getAlgoliaAdminClient();
  if (!client) return;
  let algoliaIndex = client.initIndex(collection.algoliaIndexName);
  
  let totalErrors = [];
  
  algoliaIndexDocumentBatch({ documents, collection, algoliaIndex,
    errors: totalErrors, updateFunction });
  
  //eslint-disable-next-line no-console
  console.error("Encountered the following errors while exporting to Algolia: ", totalErrors)
}

export async function algoliaIndexDocumentBatch({ documents, collection, algoliaIndex, errors, updateFunction })
{
  let importBatch = [];
  let itemsToDelete = [];
  
  for (let item of documents) {
    if (updateFunction) updateFunction(item)
    let algoliaEntries = collection.toAlgolia(item)
    if (algoliaEntries) {
      importBatch.push.apply(importBatch, algoliaEntries); // Append all of algoliaEntries to importBatch
    } else {
      itemsToDelete.push(item);
    }
  }
  
  if (importBatch.length > 0) {
    const err = await addOrUpdateIfNeeded(algoliaIndex, _.map(importBatch, _.clone));
    if (err) errors.push(err)
  }
  
  if (itemsToDelete.length > 0) {
    const err = await deleteIfPresent(algoliaIndex, itemsToDelete);
    if (err) errors.push(err)
  }
}


export async function subsetOfIdsAlgoliaShouldntIndex(collection, ids) {
  let items = collection.find({ _id: {$in: ids} }).fetch();
  let itemsToIndex = _.filter(items, item => collection.toAlgolia(item));
  let itemsToIndexById = _.keyBy(itemsToIndex, o=>o._id);
  
  return _.filter(ids, id => !(id in itemsToIndexById));
}