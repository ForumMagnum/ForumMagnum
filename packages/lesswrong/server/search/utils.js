import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
import Sequences from '../../lib/collections/sequences/collection.js';
import algoliasearch from 'algoliasearch';
import { getSetting } from 'meteor/vulcan:core';
import htmlToText from 'html-to-text';
import { dataToMarkdown } from '../editor/make_editable_callbacks'
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';
import keyBy from 'lodash/keyBy';
import chunk from 'lodash/chunk';

const COMMENT_MAX_SEARCH_CHARACTERS = 2000

Comments.toAlgolia = (comment) => {
  if (comment.deleted) return null;
  
  const algoliaComment = {
    objectID: comment._id,
    _id: comment._id,
    userId: comment.userId,
    baseScore: comment.baseScore,
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
    _id: user._id,
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
  if (post.deleted) return null;
  
  const algoliaMetaInfo = {
    _id: post._id,
    userId: post.userId,
    url: post.url,
    title: post.title,
    slug: post.slug,
    baseScore: post.baseScore,
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
    postBatch.push(_.clone({
      ...algoliaMetaInfo,
      objectID: post._id + "_0",
      body: ""
    }));
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

// Do a query, but get all of the results, instead of just the first page of
// results. Since Algolia searches have a maximum page size of 1000, this
// requires doing multiple queries with pagination.
//
// Because it does multiple queries for different pages, this may return
// duplicate results or omit results, if the index is modified while it is
// running.
async function algoliaDoCompleteSearch(algoliaIndex, query) {
  let allResults = [];
  let pageSize = 1000; // Max permitted by API
  
  let firstPageResults = await algoliaDoSearch(algoliaIndex, {
    ...query,
    hitsPerPage: pageSize,
  });
  for (let hit of firstPageResults.hits) {
    allResults.push(hit);
  }
  
  for (let i=1; i<firstPageResults.nbPages; i++) {
    let pageResults = await algoliaDoSearch(algoliaIndex, {
      ...query,
      hitsPerPage: pageSize,
      offset: pageSize*i,
    });
    
    for (let hit of pageResults.hits)
      allResults.push(hit);
  }
  
  return allResults;
}

export async function algoliaSetIndexSettings(algoliaIndex, settings) {
  return new Promise((resolve,reject) => {
    algoliaIndex.setSettings(settings,
      { forwardToReplicas: true },
      (err, content) => {
        if (err) reject(err);
        else resolve(content);
      }
    );
  });
}

export async function algoliaSetIndexSettingsAndWait(algoliaIndex, settings) {
  let result = await algoliaSetIndexSettings(algoliaIndex, settings);
  await algoliaWaitForTask(algoliaIndex, result.taskID);
}

export async function algoliaGetAllDocuments(algoliaIndex) {
  return new Promise((resolve,reject) => {
    let results = [];
    let browser = algoliaIndex.browseAll();
    
    browser.on('result', (content) => {
      for (let result of content.hits)
        results.push(result);
    });
    browser.on('end', () => {
      resolve(results);
    });
    browser.on('error', (err) => {
      reject(err);
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
// TODO: This used to return any errors encountered, but now throws them
async function addOrUpdateIfNeeded(algoliaIndex, objects) {
  if (objects.length == 0) return;
  
  const ids = _.map(objects, o=>o._id);
  const algoliaObjects = await algoliaGetObjects(algoliaIndex, ids);
  const algoliaObjectsById = keyBy(algoliaObjects, o=>o._id);
  
  const objectsToSync = _.filter(objects,
    obj => !_.isEqual(obj, algoliaObjectsById[obj._id]));
  
  if (objectsToSync.length > 0) {
    const response = await algoliaAddObjects(algoliaIndex, objectsToSync);
    await algoliaWaitForTask(algoliaIndex, response.taskID);
  }
}

// Given a list of mongo IDs that should *not* be in the Algolia index, check
// whether any are, and (if any are), delete them.
//
// We first do a series of queries, one per mongo ID, to collect the indexed
// pieces of the deleted documents (since they're split into multiple index
// entries by paragraph).
async function deleteIfPresent(algoliaIndex, ids) {
  let algoliaIdsToDelete = [];
  
  for (const mongoId of ids) {
    const results = await algoliaDoCompleteSearch(algoliaIndex, {
      query: mongoId,
      restrictSearchableAttributes: ["_id"],
      attributesToRetrieve: ['objectID','_id'],
    });
    for (const hit of results)
      algoliaIdsToDelete.push(hit.objectID);
  }
  
  if (algoliaIdsToDelete.length > 0) {
    const response = await algoliaDeleteIds(algoliaIndex, algoliaIdsToDelete);
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
  let algoliaIndex = client.initIndex(algoliaIndexNames[collection.collectionName]);
  
  let totalErrors = [];
  
  await algoliaIndexDocumentBatch({ documents, collection, algoliaIndex,
    errors: totalErrors, updateFunction });
  
  if (totalErrors.length > 0) {
    //eslint-disable-next-line no-console
    console.error("Encountered the following errors while exporting to Algolia: ", totalErrors)
  }
}

// Sometimes 100 posts generate more index requests than algolia will willingly
// handle - split them up in that case
// Export for testing
export function subBatchArray (arr, maxSize) {
  const result = []
  while (arr.length > 0) {
    result.push(arr.slice(0, maxSize))
    arr = arr.slice(maxSize, arr.length)
  }
  return result
}

export async function algoliaIndexDocumentBatch({ documents, collection, algoliaIndex, errors, updateFunction })
{
  let importBatch = [];
  let itemsToDelete = [];

  for (let item of documents) {
    if (updateFunction) updateFunction(item)
    
    let algoliaEntries = (collection.checkAccess && collection.checkAccess(null, item)) ? collection.toAlgolia(item) : null;
    if (algoliaEntries) {
      importBatch.push.apply(importBatch, algoliaEntries); // Append all of algoliaEntries to importBatch
    } else {
      itemsToDelete.push(item._id);
    }
  }

  if (importBatch.length > 0) {
    const subBatches = subBatchArray(importBatch, 1000)
    for (const subBatch of subBatches) {
      let err
      try {
        err = await addOrUpdateIfNeeded(algoliaIndex, _.map(subBatch, _.clone));
      } catch (uncaughtErr) {
        err = uncaughtErr
      }
      if (err) errors.push(err)
    }
  }
  
  if (itemsToDelete.length > 0) {
    const err = await deleteIfPresent(algoliaIndex, itemsToDelete);
    if (err) errors.push(err)
  }
}


export async function subsetOfIdsAlgoliaShouldntIndex(collection, ids) {
  // Filter out duplicates
  const sortedIds = _.clone(ids).sort();
  const uniqueIds = _.uniq(sortedIds, true);
  const pages = chunk(uniqueIds, 1000);
  let itemsToIndexById = {};
  
  for (let page of pages) {
    let items = await collection.find({ _id: {$in: page} }).fetch();
    let itemsToIndex = _.filter(items, item => collection.toAlgolia(item));
    for (let item of itemsToIndex) {
      itemsToIndexById[item._id] = true;
    }
  }
  
  return _.filter(ids, id => !(id in itemsToIndexById));
}
