import { mongoFind } from '../../mongoQueries';
import { getSiteUrl } from '../../vulcan-lib/utils';
import keyBy from 'lodash/keyBy';
import * as _ from 'underscore';

// TODO: Make these functions able to use loaders for caching.

export const sequenceGetPageUrl = function(sequence, isAbsolute = false){
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

export const sequenceGetAllPostIDs = async (sequenceId: string): Promise<Array<string>> => {
  const chapters = await mongoFind("Chapters", {sequenceId: sequenceId}, {sort: {number: 1}});
  let allPostIds = _.flatten(_.pluck(chapters, 'postIds'))
  const validPostIds = _.filter(allPostIds, postId=>!!postId);
  return validPostIds;
}

export const sequenceGetAllPosts = async (sequenceId: string): Promise<Array<DbPost>> => {
  // Get the set of post IDs in the sequence (by joining against the Chapters
  // table), sorted in reading order
  const allPostIds = await sequenceGetAllPostIDs(sequenceId);
  
  // Retrieve those posts
  const posts = await mongoFind("Posts", {_id:{$in:allPostIds}});
  
  // Sort the posts retrieved back into reading order and return them
  const postsById = keyBy(posts, post=>post._id);
  return _.map(allPostIds, id=>postsById[id]).filter(post => !!post);
}

// Given a post ID and the ID of a sequence which contains that post, return the
// next post in the sequence, or null if it was the last post. Does not handle
// cross-sequence boundaries. If the given post ID is not in the sequence,
// returns null.
export const sequenceGetNextPostID = async function(sequenceId: string, postId: string): Promise<string|null> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId);
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

// Given a post ID and the ID of a sequence which contains that post, return the
// previous post in the sequence, or null if it was the first post. Does not
// handle cross-sequence boundaries. If the given post ID is not in the
// sequence, returns null.
export const sequenceGetPrevPostID = async function(sequenceId: string, postId: string): Promise<string|null> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId);
  const postIndex = _.indexOf(postIDs, postId);
  
  if (postIndex < 0) {
    // Post is not in this sequence
    return null;
  } else if (postIndex==0) {
    // Post is the first post in this sequence
    return null;
  } else {
    // Post is in this sequence, not first. Return the previous post ID.
    return postIDs[postIndex-1];
  }
}

export const sequenceContainsPost = async function(sequenceId: string, postId: string): Promise<boolean> {
  const postIDs = await sequenceGetAllPostIDs(sequenceId);
  const postIndex = _.indexOf(postIDs, postId);
  return postIndex >= 0;
}
