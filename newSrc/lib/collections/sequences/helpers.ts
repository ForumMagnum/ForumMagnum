import Sequences from './collection';
import { Posts } from '../posts/index';
import Chapters from '../chapters/collection';
import { Utils } from '../../vulcan-lib';
import keyBy from 'lodash/keyBy';
import * as _ from 'underscore';

// TODO: Make these functions able to use loaders for caching.

Sequences.getPageUrl = function(sequence, isAbsolute = false){
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

Sequences.getAllPostIDs = async (sequenceId: string): Promise<Array<string>> => {
  const chapters = await Chapters.find({sequenceId: sequenceId}, {sort: {number: 1}}).fetch()
  let allPostIds = _.flatten(_.pluck(chapters, 'postIds'))
  const validPostIds = _.filter(allPostIds, postId=>!!postId);
  return validPostIds;
}

Sequences.getAllPosts = async (sequenceId: string): Promise<Array<DbPost>> => {
  // Get the set of post IDs in the sequence (by joining against the Chapters
  // table), sorted in reading order
  const allPostIds = await Sequences.getAllPostIDs(sequenceId);
  
  // Retrieve those posts
  const posts = await Posts.find({_id:{$in:allPostIds}}).fetch()
  
  // Sort the posts retrieved back into reading order and return them
  const postsById = keyBy(posts, post=>post._id);
  return _.map(allPostIds, id=>postsById[id]);
}

// Given a post ID and the ID of a sequence which contains that post, return the
// next post in the sequence, or null if it was the last post. Does not handle
// cross-sequence boundaries. If the given post ID is not in the sequence,
// returns null.
Sequences.getNextPostID = async function(sequenceId: string, postId: string): Promise<string|null> {
  const postIDs = await Sequences.getAllPostIDs(sequenceId);
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
Sequences.getPrevPostID = async function(sequenceId: string, postId: string): Promise<string|null> {
  const postIDs = await Sequences.getAllPostIDs(sequenceId);
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

Sequences.sequenceContainsPost = async function(sequenceId: string, postId: string): Promise<boolean> {
  const postIDs = await Sequences.getAllPostIDs(sequenceId);
  const postIndex = _.indexOf(postIDs, postId);
  return postIndex >= 0;
}
