import algoliasearch from 'algoliasearch';
import { htmlToText } from 'html-to-text';
import chunk from 'lodash/chunk';
import keyBy from 'lodash/keyBy';
import { isAnyTest } from '../../lib/executionEnvironment';
import * as _ from 'underscore';
import { getAlgoliaIndexName, collectionIsAlgoliaIndexed, AlgoliaIndexCollectionName } from '../../lib/algoliaUtil';
import { Comments } from '../../lib/collections/comments';
import { Posts } from '../../lib/collections/posts';
import { postStatuses } from '../../lib/collections/posts/constants';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import Sequences from '../../lib/collections/sequences/collection';
import { Tags } from '../../lib/collections/tags/collection';
import Users from '../../lib/collections/users/collection';
import { algoliaAppIdSetting } from '../../lib/publicSettings';
import { DatabaseServerSetting } from '../databaseSettings';
import { dataToMarkdown } from '../editor/conversionUtils';
import filter from 'lodash/filter';
import { asyncFilter } from '../../lib/utils/asyncUtils';
import { truncatise } from '../../lib/truncatise';
import { subBatchArray } from './subBatchArray';
import moment from 'moment';

export type AlgoliaIndexedDbObject = DbComment|DbPost|DbUser|DbSequence|DbTag;

export interface AlgoliaIndexedCollection<T extends AlgoliaIndexedDbObject> extends CollectionBase<T, AlgoliaIndexCollectionName> {
  toAlgolia: (document: T) => Promise<Array<AlgoliaDocument>|null>
}

const COMMENT_MAX_SEARCH_CHARACTERS = 18000
const USER_BIO_MAX_SEARCH_CHARACTERS = COMMENT_MAX_SEARCH_CHARACTERS
const TAG_MAX_SEARCH_CHARACTERS = COMMENT_MAX_SEARCH_CHARACTERS;

Comments.toAlgolia = async (comment: DbComment): Promise<Array<AlgoliaComment>|null> => {
  if (comment.deleted || comment.rejected || comment.authorIsUnreviewed ) return null;
  
  const algoliaComment: AlgoliaComment = {
    objectID: comment._id,
    _id: comment._id,
    userId: comment.userId,
    baseScore: comment.baseScore,
    isDeleted: comment.deleted,
    retracted: comment.retracted,
    deleted: comment.deleted,
    spam: comment.spam,
    legacy: comment.legacy,
    userIP: comment.userIP,
    createdAt: comment.createdAt,
    postedAt: comment.postedAt,
    publicDateMs: moment(comment.postedAt).valueOf(),
    af: comment.af,
    tags: comment.tagId ? [comment.tagId] : [],
    body: "",
  };
  const commentAuthor = await Users.findOne({_id: comment.userId});
  if (commentAuthor && !commentAuthor.deleted) {
    algoliaComment.authorDisplayName = commentAuthor.displayName;
    algoliaComment.authorUserName = commentAuthor.username;
    algoliaComment.authorSlug = commentAuthor.slug;
  }
  if (comment.postId) {
    const parentPost = await Posts.findOne({_id: comment.postId});
    if (parentPost) {
      algoliaComment.postId = comment.postId;
      algoliaComment.postTitle = parentPost.title;
      algoliaComment.postSlug = parentPost.slug;
      algoliaComment.postIsEvent = parentPost.isEvent;
      algoliaComment.postGroupId = parentPost.groupId;
      const tags = parentPost.tagRelevance ?
        Object.entries(parentPost.tagRelevance).filter(([tagId, relevance]:[string, number]) => relevance > 0).map(([tagId]) => tagId)
        : []
      algoliaComment.tags = tags
    }
  }
  if (comment.tagId) {
    const tag = await Tags.findOne({_id: comment.tagId});
    if (tag) {
      algoliaComment.tagId = comment.tagId;
      algoliaComment.tagCommentType = comment.tagCommentType;
      algoliaComment.tagName = tag.name;
      algoliaComment.tagSlug = tag.slug;
    }
  }

  let body = ""
  if (comment.contents?.originalContents?.type) {
    const { data, type } = comment.contents.originalContents
    body = dataToMarkdown(data, type)
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  //  TODO: Actually limit by encoding size as opposed to characters
  algoliaComment.body = body.slice(0, COMMENT_MAX_SEARCH_CHARACTERS)
  return [algoliaComment]
}

Sequences.toAlgolia = async (sequence: DbSequence): Promise<Array<AlgoliaSequence>|null> => {
  if (sequence.isDeleted || sequence.draft || sequence.hidden)
    return null;
  
  const algoliaSequence: AlgoliaSequence = {
    objectID: sequence._id,
    _id: sequence._id,
    title: sequence.title,
    userId: sequence.userId,
    createdAt: sequence.createdAt,
    publicDateMs: moment(sequence.createdAt).valueOf(),
    af: sequence.af,
    plaintextDescription: "",
    bannerImageId: sequence.bannerImageId,
  };
  const sequenceAuthor = await Users.findOne({_id: sequence.userId});
  if (sequenceAuthor) {
    algoliaSequence.authorDisplayName = sequenceAuthor.displayName;
    algoliaSequence.authorUserName = sequenceAuthor.username;
    algoliaSequence.authorSlug = sequenceAuthor.slug;
  }
  //  Limit comment size to ensure we stay below Algolia search Limit
  // TODO: Actually limit by encoding size as opposed to characters
  const { html = "" } = sequence.contents || {};
  const plaintextBody = htmlToText(html);
  algoliaSequence.plaintextDescription = plaintextBody.slice(0, 2000);
  return [algoliaSequence]
}

Users.toAlgolia = async (user: DbUser): Promise<Array<AlgoliaUser>|null> => {
  if (user.deleted) return null;
  if (user.deleteContent) return null;
  
  let howOthersCanHelpMe = ""
  if (user.howOthersCanHelpMe?.originalContents?.type) {
    const { data, type } = user.howOthersCanHelpMe.originalContents
    howOthersCanHelpMe = dataToMarkdown(data, type)
  }
  let howICanHelpOthers = ""
  if (user.howICanHelpOthers?.originalContents?.type) {
    const { data, type } = user.howICanHelpOthers.originalContents
    howICanHelpOthers = dataToMarkdown(data, type)
  }
  
  const bioOriginalContents = user.biography?.originalContents;
  const bio = bioOriginalContents ? dataToMarkdown(bioOriginalContents.data, bioOriginalContents.type) : "";
  const htmlBio = user.biography?.html || "";
  
  const algoliaUser: AlgoliaUser = {
    _id: user._id,
    objectID: user._id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    publicDateMs: moment(user.createdAt).valueOf(),
    isAdmin: user.isAdmin,
    profileImageId: user.profileImageId,
    bio: bio.slice(0, USER_BIO_MAX_SEARCH_CHARACTERS),
    htmlBio: truncatise(htmlBio, {
      TruncateBy: 'characters',
      TruncateLength: USER_BIO_MAX_SEARCH_CHARACTERS - 500 // some buffer for HTML tags
    }),
    howOthersCanHelpMe: howOthersCanHelpMe.slice(0, USER_BIO_MAX_SEARCH_CHARACTERS),
    howICanHelpOthers: howICanHelpOthers.slice(0, USER_BIO_MAX_SEARCH_CHARACTERS),
    karma: user.karma,
    slug: user.slug,
    jobTitle: user.jobTitle,
    organization: user.organization,
    careerStage: user.careerStage,
    website: user.website,
    groups: user.groups,
    af: user.groups && user.groups.includes('alignmentForum'),
    tags: user.profileTagIds,
    ...(user.mapLocation?.geometry?.location?.lat && {_geoloc: {
      lat: user.mapLocation.geometry.location.lat,
      lng: user.mapLocation.geometry.location.lng,
    }}),
    ...(user.mapLocation?.formatted_address && {mapLocationAddress: user.mapLocation.formatted_address})
  }
  return [algoliaUser];
}

// TODO: Refactor this to no longer by this insane parallel code path, and instead just make a graphQL query and use all the relevant data
Posts.toAlgolia = async (post: DbPost): Promise<Array<AlgoliaPost>|null> => {
  if (post.status !== postStatuses.STATUS_APPROVED)
    return null;
  if (post.authorIsUnreviewed)
    return null;
  if (post.rejected)
    return null;
  
  const tags = post.tagRelevance ? 
    Object.entries(post.tagRelevance).filter(([tagId, relevance]:[string, number]) => relevance > 0).map(([tagId]) => tagId)
    : []
  const algoliaMetaInfo: AlgoliaPost = {
    _id: post._id,
    userId: post.userId,
    url: post.url,
    title: post.title,
    slug: post.slug,
    baseScore: post.baseScore,
    status: post.status,
    curated: !!post.curatedDate,
    legacy: post.legacy,
    commentCount: post.commentCount,
    // TODO: handle afCommentCount
    userIP: post.userIP,
    createdAt: post.createdAt,
    postedAt: post.postedAt,
    publicDateMs: moment(post.postedAt).valueOf(),
    isFuture: post.isFuture,
    isEvent: post.isEvent,
    viewCount: post.viewCount,
    lastCommentedAt: post.lastCommentedAt,
    draft: post.draft,
    af: post.af,
    tags,
    body: "",
    order: 0,
  };
  const postAuthor = await Users.findOne({_id: post.userId});
  if (postAuthor && !postAuthor.deleted) {
    algoliaMetaInfo.authorSlug = postAuthor.slug;
    algoliaMetaInfo.authorDisplayName = postAuthor.displayName;
    algoliaMetaInfo.authorFullName = postAuthor.fullName;
  }
  const postFeed = await RSSFeeds.findOne({_id: post.feedId});
  if (postFeed) {
    algoliaMetaInfo.feedName = postFeed.nickname;
    algoliaMetaInfo.feedLink = post.feedLink;
  }
  let postBatch: Array<AlgoliaPost> = [];
  let body = ""
  if (post.contents?.originalContents?.type) {
    const { data, type } = post.contents.originalContents
    try {
      body = dataToMarkdown(data, type)
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log(`Failed in dataToMarkdown on post body of ${post._id}`);
    }
  }
  if (body) {
    body.split("\n\n").forEach((paragraph, paragraphCounter) => {
      postBatch.push(_.clone({
        ...algoliaMetaInfo,
        objectID: post._id + "_" + paragraphCounter,
        
        // Algolia limits text to 20 KB. They don't say what encoding they use though. 
        // Some random tests seem to imply that they use UTF-8, which means between 1 and 4 bytes per character.
        // So limit to 18,000 characters under the assumption that we have ~1.1 bytes/character.
        body: paragraph.slice(0, 18000),
        order: paragraphCounter
      }));
    })
  } else {
    postBatch.push(_.clone({
      ...algoliaMetaInfo,
      objectID: post._id + "_0",
      body: "",
      order: 0
    }));
  }
  return postBatch
}

Tags.toAlgolia = async (tag: DbTag): Promise<Array<AlgoliaTag>|null> => {
  if (tag.deleted) return null;
  if (tag.adminOnly) return null;
  
  let description = ""
  if (tag.description?.originalContents?.type) {
    const { data, type } = tag.description.originalContents
    description = dataToMarkdown(data, type)
  }
  // Limit tag description  size to ensure we stay below Algolia search Limit
  // TODO: Actually limit by encoding size as opposed to characters
  description = description.slice(0, TAG_MAX_SEARCH_CHARACTERS)
  
  return [{
    _id: tag._id,
    objectID: tag._id,
    name: tag.name,
    slug: tag.slug,
    core: tag.core,
    defaultOrder: tag.defaultOrder,
    suggestedAsFilter: tag.suggestedAsFilter,
    postCount: tag.postCount,
    wikiOnly: tag.wikiOnly,
    isSubforum: tag.isSubforum,
    description,
    bannerImageId: tag.bannerImageId,
    parentTagId: tag.parentTagId,
  }];
}


// Do algoliaIndex.waitTask as an async function rather than a
// callback-accepting function.
async function algoliaWaitForTask(algoliaIndex: algoliasearch.Index, taskID: number) {
  return new Promise<void>((resolve,reject) => {
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
async function algoliaAddObjects(algoliaIndex: algoliasearch.Index, objects: Array<AlgoliaDocument>) {
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
export async function algoliaDeleteIds(algoliaIndex: algoliasearch.Index, ids: Array<string>)
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
async function algoliaGetObjects(algoliaIndex: algoliasearch.Index, ids: Array<string>): Promise<{results: Array<AlgoliaDocument>}>
{
  return new Promise((resolve: (result: {results: Array<AlgoliaDocument>})=>void, reject) => {
    algoliaIndex.getObjects(ids, (err,content) => {
      if (err) {
        reject(err);
      } else {
        // Downcast because Algolia doesn't guarantee an _id field, but our schema does
        resolve(content as {results: Array<AlgoliaDocument>});
      }
    });
  });
}

export async function algoliaDoSearch(algoliaIndex: algoliasearch.Index, query: algoliasearch.QueryParameters) {
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
//
// IMPORTANT CAVEAT: If this index uses 'distinct', only one entry from each
// group will be returned.
async function algoliaDoCompleteSearch(algoliaIndex: algoliasearch.Index, query: algoliasearch.QueryParameters) {
  let allResults: Array<any> = [];
  let pageSize = 1000; // Max permitted by API
  
  let firstPageResults: any = await algoliaDoSearch(algoliaIndex, {
    ...query,
    hitsPerPage: pageSize,
  });
  for (let hit of firstPageResults.hits) {
    allResults.push(hit);
  }
  
  for (let i=1; i<firstPageResults.nbPages; i++) {
    let pageResults: any = await algoliaDoSearch(algoliaIndex, {
      ...query,
      hitsPerPage: pageSize,
      offset: pageSize*i,
    });
    
    for (let hit of pageResults.hits)
      allResults.push(hit);
  }
  
  return allResults;
}

export async function algoliaSetIndexSettings(algoliaIndex: algoliasearch.Index, settings: algoliasearch.IndexSettings) {
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

export async function algoliaSetIndexSettingsAndWait(algoliaIndex: algoliasearch.Index, settings: algoliasearch.IndexSettings) {
  let result: any = await algoliaSetIndexSettings(algoliaIndex, settings);
  await algoliaWaitForTask(algoliaIndex, result.taskID);
}

export async function algoliaGetAllDocuments(algoliaIndex: algoliasearch.Index): Promise<Array<AlgoliaDocument>> {
  return new Promise((resolve,reject) => {
    let results: Array<AlgoliaDocument> = [];
    let browser = algoliaIndex.browseAll();
    
    browser.on('result', (content) => {
      for (let result of content.hits) {
        // Downcast because Algolia doesn't guarantee an _id field, but our schema does
        results.push(result as AlgoliaDocument);
      }
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
async function addOrUpdateIfNeeded(algoliaIndex: algoliasearch.Index, objects: Array<AlgoliaDocument>) {
  if (objects.length == 0) return;
  
  const ids = _.map(objects, o=>o._id);
  const algoliaObjects: Array<AlgoliaDocument|null> = (await algoliaGetObjects(algoliaIndex, ids)).results;
  // Workaround for getting filter to properly typecheck: https://github.com/microsoft/TypeScript/issues/16069#issuecomment-392022894
  const isNotNull = <T extends {}>(x:undefined | null | T) : x is T => !!x
  const algoliaObjectsNonnull: Array<AlgoliaDocument> = filter(algoliaObjects, isNotNull);
  const algoliaObjectsById = keyBy(algoliaObjectsNonnull, o=>o._id);
  
  const objectsToSync = _.filter(objects,
    obj => !_.isEqual(obj, algoliaObjectsById[obj._id]));
  
  if (objectsToSync.length > 0) {
    const response: any = await algoliaAddObjects(algoliaIndex, objectsToSync);
    await algoliaWaitForTask(algoliaIndex, response.taskID);
  }
}

// Find the largest ID in this group. Unfortunately the only way to do this is
// to try retrieving different IDs, and see what does and doesn't come back.
async function getHighestGroupIndexInGroup(algoliaIndex: algoliasearch.Index, mongoId: string, lowerBound: number): Promise<number> {
  let largestIndex = lowerBound;
  while (await algoliaIdExists(algoliaIndex, `${mongoId}_${largestIndex+1}`)) {
    largestIndex++;
  }
  return largestIndex;
}

 /**
  * TODO-FIXME: Seems to be broken, based on bugged behavior. Fix with distinct
  * search instead.
  *
  * Given a set of objectIDs, some of which are of the form
  * (mongoId)_(groupIndex) and some of which aren't, some of which share
  * mongoIds but not groupIndexes, return all objectIDs in the algolia index
  * which share a mongoId with one of the provided objectIDs, but have a higher
  * groupIndex than any in the input.
  */
async function algoliaObjectIDsToHigherIDSet(algoliaIndex: algoliasearch.Index, ids: Array<string>): Promise<Array<string>> {
  const highestGroupIndexes: Record<string,number> = {};
  for (let id of ids) {
    if (id.indexOf('_') >= 0) {
      const [mongoId, groupIndexStr] = id.split('_');
      const groupIndex = parseInt(groupIndexStr);
      if (!(mongoId in highestGroupIndexes) || (groupIndex > highestGroupIndexes[mongoId]))
        highestGroupIndexes[mongoId] = groupIndex;
    }
  }
  
  let result: Array<string> = [];
  for (let mongoId of Object.keys(highestGroupIndexes)) {
    const largestIndexInInput = highestGroupIndexes[mongoId];
    const largestIndexInAlgolia = await getHighestGroupIndexInGroup(algoliaIndex, mongoId, largestIndexInInput);
    for (let i=largestIndexInInput+1; i<=largestIndexInAlgolia; i++)
      result.push(`${mongoId}_${i}`);
  }
  return result;
}

async function algoliaIdExists(algoliaIndex: algoliasearch.Index, id: string): Promise<boolean> {
  const response = await algoliaGetObjects(algoliaIndex, [id]);
  const nonnullResults = _.filter(response.results, r=>!!r);
  return nonnullResults.length>0;
}

// Given a list of mongo IDs that should *not* be in the Algolia index, check
// whether any are, and (if any are), delete them.
//
// We first do a series of queries, one per mongo ID, to collect the indexed
// pieces of the deleted documents (since they're split into multiple index
// entries by paragraph).
async function deleteIfPresent(algoliaIndex: algoliasearch.Index, ids: Array<string>) {
  let algoliaIdsToDelete: Array<any> = [];
  
  for (const mongoId of ids) {
    const results = await algoliaDoCompleteSearch(algoliaIndex, {
      query: mongoId,
      restrictSearchableAttributes: ["_id"],
      attributesToRetrieve: ['objectID','_id'],
      distinct: false,
    });
    for (const hit of results) {
      algoliaIdsToDelete.push(hit.objectID);
    }
  }
  
  if (algoliaIdsToDelete.length > 0) {
    const response: any = await algoliaDeleteIds(algoliaIndex, algoliaIdsToDelete);
    await algoliaWaitForTask(algoliaIndex, response.taskID);
  }
}

const algoliaAdminKeySetting = new DatabaseServerSetting<string | null>('algolia.adminKey', null)
export function getAlgoliaAdminClient()
{
  const algoliaAppId = algoliaAppIdSetting.get();
  const algoliaAdminKey = algoliaAdminKeySetting.get()
  
  if (!algoliaAppId || !algoliaAdminKey) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.info("No Algolia credentials found. To activate search please provide 'algolia.appId' and 'algolia.adminKey' in the settings")
    }
    return null;
  }
  
  let client = algoliasearch(algoliaAppId, algoliaAdminKey);
  return client;
}

export async function algoliaDocumentExport<T extends AlgoliaIndexedDbObject>({ documents, collection, updateFunction}: {
  documents: Array<AlgoliaIndexedDbObject>,
  collection: AlgoliaIndexedCollection<T>,
  updateFunction?: any,
}) {
  if (!collectionIsAlgoliaIndexed(collection.collectionName)) {
    // If this is a collection that isn't Algolia-indexed, don't index it. (This
    // gets called from voting code, which tried to update Algolia indexes to
    // change baseScore. tagRels have voting, but aren't Algolia-indexed.)
    return;
  }
  let client = getAlgoliaAdminClient();
  if (!client) {
    return;
  }
  let algoliaIndex = client.initIndex(getAlgoliaIndexName(collection.collectionName as AlgoliaIndexCollectionName));
  
  let totalErrors: any[] = [];
  
  await algoliaIndexDocumentBatch({
    documents,
    collection: collection as AlgoliaIndexedCollection<AlgoliaIndexedDbObject>,
    algoliaIndex,
    errors: totalErrors,
    updateFunction
  });
  
  if (totalErrors.length > 0) {
    //eslint-disable-next-line no-console
    console.error("Encountered the following errors while exporting to Algolia: ", totalErrors)
  }
}

export async function algoliaExportById<T extends AlgoliaIndexedDbObject>(collection: AlgoliaIndexedCollection<T>, documentId: string) {
  const document = await collection.findOne({_id: documentId});
  if (document) {
    await algoliaDocumentExport({ documents: [document], collection });
  }
}

export async function algoliaIndexDocumentBatch<T extends AlgoliaIndexedDbObject>({ documents, collection, algoliaIndex, errors, updateFunction }: {
  documents: Array<T>,
  collection: AlgoliaIndexedCollection<T>,
  algoliaIndex: algoliasearch.Index,
  errors: Array<any>,
  updateFunction: any,
})
{
  let importBatch: Array<AlgoliaDocument> = [];
  let itemsToDelete: Array<string> = [];

  for (let item of documents) {
    if (updateFunction) updateFunction(item)
    
    const canAccess = collection.checkAccess ? await collection.checkAccess(null, item, null) : true;
    let algoliaEntries: Array<AlgoliaDocument>|null = canAccess ? await collection.toAlgolia(item) : null;
    if (algoliaEntries && algoliaEntries.length>0) {
      importBatch.push.apply(importBatch, algoliaEntries); // Append all of algoliaEntries to importBatch
    } else {
      itemsToDelete.push(item._id);
    }
  }
  
  if (importBatch.length > 0) {
    const subBatches = subBatchArray(importBatch, 1000)
    for (const subBatch of subBatches) {
      const objectIdsAdded = _.map(subBatch, doc=>doc.objectID);
      const excessIdsToDelete = await algoliaObjectIDsToHigherIDSet(algoliaIndex, objectIdsAdded);
      
      let err
      try {
        if (excessIdsToDelete.length > 0) {
          const deleteResponse: any = await algoliaDeleteIds(algoliaIndex, excessIdsToDelete);
          await algoliaWaitForTask(algoliaIndex, deleteResponse.taskID);
        }
        
        err = await addOrUpdateIfNeeded(algoliaIndex, _.map(subBatch, _.clone));
      } catch (uncaughtErr) {
        err = uncaughtErr
      }
      if (err) errors.push(err)
    }
  }
  
  if (itemsToDelete.length > 0) {
    const err: any = await deleteIfPresent(algoliaIndex, itemsToDelete);
    if (err) errors.push(err)
  }
}


export async function subsetOfIdsAlgoliaShouldntIndex<T extends AlgoliaIndexedDbObject>(collection: AlgoliaIndexedCollection<T>, ids: Array<string>) {
  // Filter out duplicates
  const sortedIds = _.clone(ids).sort();
  const uniqueIds = _.uniq(sortedIds, true);
  // eslint-disable-next-line no-console
  console.log(`Algolia index contains ${uniqueIds.length} unique IDs`);
  const pages = chunk(uniqueIds, 1000);
  let itemsToIndexById: Record<string,boolean> = {};
  let pageNum=0;
  
  for (let page of pages) {
    // eslint-disable-next-line no-console
    console.log(`Checking page ${pageNum}/${pages.length}...`);
    pageNum++;
    let items: Array<T> = await collection.find({ _id: {$in: page} }).fetch();
    let itemsToIndex = await asyncFilter(items, async (item: T) => {
      try {
        return !!(await collection.toAlgolia(item));
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(`Failed in ${collection.collectionName}.toAlgolia(${item._id}): ${e}`);
        return false;
      }
    });
    for (let item of itemsToIndex) {
      itemsToIndexById[item._id] = true;
    }
  }
  
  return _.filter(ids, id => !(id in itemsToIndexById));
}
