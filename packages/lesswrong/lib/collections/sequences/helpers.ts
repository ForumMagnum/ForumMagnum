import { getSiteUrl } from '../../vulcan-lib/utils';
import { accessFilterMultiple } from '../../utils/schemaUtils';
import { loadByIds } from '../../loaders';
import keyBy from 'lodash/keyBy';
import * as _ from 'underscore';
import type { RouterLocation } from '../../vulcan-lib/routes';
import type { Request, Response } from 'express';

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

interface SequencePostId {
  sequenceId: string,
  postId: string
}

// TODO: Make these functions able to use loaders for caching.

export const sequenceGetPageUrl = function(sequence: {_id: string}, isAbsolute = false){
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

export const getCollectionOrSequenceUrl = function (sequence: SequencesPageTitleFragment, isAbsolute = false) {
  if (!sequence.canonicalCollectionSlug) return sequenceGetPageUrl(sequence, isAbsolute)
  
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${sequence.canonicalCollectionSlug}#${sequence._id}`
}

export const sequenceGetAllPostIDs = async (sequenceId: string, context: ResolverContext): Promise<Array<string>> => {
  const chapters = await context.Chapters.find({sequenceId: sequenceId}, {sort: {number: 1}}).fetch();
  let allPostIds = _.flatten(_.pluck(chapters, 'postIds'))
  
  // Filter out nulls
  const validPostIds = _.filter(allPostIds, postId=>!!postId);
  
  // Filter by user access
  const posts = await loadByIds(context, "Posts", validPostIds);
  const accessiblePosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context);
  return accessiblePosts.map(post => post._id!);
}

export const sequenceGetAllPosts = async (sequenceId: string | null, context: ResolverContext): Promise<Array<DbPost>> => {
  // Get the set of post IDs in the sequence (by joining against the Chapters
  // table), sorted in reading order
  if (!sequenceId) return [];
  const allPostIds = await sequenceGetAllPostIDs(sequenceId, context);
  
  // Retrieve those posts
  const posts = await context.Posts.find({_id:{$in:allPostIds}}).fetch();
  
  // Sort the posts retrieved back into reading order and return them
  const postsById = keyBy(posts, post=>post._id);
  return _.map(allPostIds, id=>postsById[id]).filter(post => !!post);
}

const getSequenceCollectionBooks = async function(sequenceId: string, context: ResolverContext) {
  const { Sequences, Books, Collections } = context;
  const sequence = await Sequences.findOne({ _id: sequenceId });
  if (!sequence?.canonicalCollectionSlug) return;

  const { canonicalCollectionSlug } = sequence;

  const collection = await Collections.findOne({ slug: canonicalCollectionSlug });
  if (!collection) return;

  const { _id: collectionId } = collection;

  return Books.find({ collectionId }, { sort: { number: 1 } }).fetch();
}

const getSurroundingSequencePostIdTuples = async function (sequenceId: string, context: ResolverContext) {
  const books = await getSequenceCollectionBooks(sequenceId, context);
  if (!books) return;

  const allSequenceIds = books.flatMap(book => book.sequenceIds);

  const currentSequenceIndex = allSequenceIds.indexOf(sequenceId);

  // We don't need to get all the sequences in the collection, that'd be expensive
  // Just get the one before the current one (if it's not the first) and the one after the current one (if it's not the last)
  const surroundingSequenceIds = [
    allSequenceIds[currentSequenceIndex - 1],
    allSequenceIds[currentSequenceIndex],
    allSequenceIds[currentSequenceIndex + 1]
  ].filter(id => !!id);

  const postIdsBySequence = await Promise.all(
    surroundingSequenceIds.map(seqId =>
      sequenceGetAllPostIDs(seqId, context)
        .then((postIds) => postIds.map(postId => ({ sequenceId: seqId, postId })))
    )
  );

  return postIdsBySequence.flat();
}

/**
 * Gets the next post ID from the collection the post belongs to, which is determined by the sequenceId
 */
 export const getNextPostIdFromNextSequence = async function (sequenceId: string, postId: string, context: ResolverContext): Promise<SequencePostId | undefined> {
  const sequencePostIdTuples = await getSurroundingSequencePostIdTuples(sequenceId, context);
  if (!sequencePostIdTuples) return;

  const index = sequencePostIdTuples.findIndex((idTuple) => idTuple.postId === postId);
  return sequencePostIdTuples[index + 1];
}

// Given a post ID and the ID of a sequence which contains that post, return the
// next post in the sequence, or null if it was the last post. Does not handle
// cross-sequence boundaries. If the given post ID is not in the sequence,
// returns null.
export const sequenceGetNextPostID = async function(sequenceId: string, postId: string, context: ResolverContext): Promise<string|null> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId, context);
  const postIndex = _.indexOf(postIDs, postId);
  
  if (postIndex < 0) {
    // Post is not in this sequence
    return null;
  } else if (postIndex+1 >= postIDs.length) {
    // Post is the last post in this sequence
    return null;
  } else {
    // Post is in this sequence, not last. Return the next post ID.
    return postIDs[postIndex+1];
  }
}

/**
 * Gets the previous post ID from the collection the post belongs to, which is determined by the sequenceId
 */
export const getPrevPostIdFromPrevSequence = async function (sequenceId: string, postId: string, context: ResolverContext): Promise<SequencePostId | undefined> {
  const sequencePostIdTuples = await getSurroundingSequencePostIdTuples(sequenceId, context);
  if (!sequencePostIdTuples) return;

  const index = sequencePostIdTuples.findIndex((idTuple) => idTuple.postId === postId);
  return sequencePostIdTuples[index - 1];
}

// Given a post ID and the ID of a sequence which contains that post, return the
// previous post in the sequence, or null if it was the first post. Does not
// handle cross-sequence boundaries. If the given post ID is not in the
// sequence, returns null.
export const sequenceGetPrevPostID = async function(sequenceId: string, postId: string, context: ResolverContext): Promise<string|null> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId, context);
  const postIndex = _.indexOf(postIDs, postId);
  
  if (postIndex < 0) {
    // Post is not in this sequence
    return null;
  } else if (postIndex===0) {
    // Post is the first post in this sequence
    return null;
  } else {
    // Post is in this sequence, not first. Return the previous post ID.
    return postIDs[postIndex-1];
  }
}

export const sequenceContainsPost = async function(sequenceId: string, postId: string, context: ResolverContext): Promise<boolean> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId, context);
  const postIndex = _.indexOf(postIDs, postId);
  return postIndex >= 0;
}

export const sequenceRouteWillDefinitelyReturn200 = async (req: Request, res: Response, parsedRoute: RouterLocation, context: ResolverContext) => {
  const sequenceId = parsedRoute.params._id;
  if (!sequenceId) return false;
  return await context.repos.sequences.sequenceRouteWillDefinitelyReturn200(sequenceId);
}
