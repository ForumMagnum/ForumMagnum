import Sequences from './collection.js';
import { Posts } from '../posts/index.js';
import Chapters from '../chapters/collection.js';
import { Utils } from 'meteor/vulcan:core';
import keyBy from 'lodash/keyBy';

Sequences.getPageUrl = function(sequence, isAbsolute = false){
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

Sequences.getAllPostIDs = async (sequenceId) => {
  const chapters = await Chapters.find({sequenceId: sequenceId}, {sort: {number: 1}}).fetch()
  let allPostIds = _.flatten(_.pluck(chapters, 'postIds'))
  return allPostIds;
}

Sequences.getAllPosts = async (sequenceId) => {
  // Get the set of post IDs in the sequence (by joining against the Chapters
  // table), sorted in reading order
  const allPostIds = Sequences.getAllPostIDs(sequenceId);
  
  // Retrieve those posts
  const posts = await Posts.find({_id:{$in:allPostIds}}).fetch()
  
  // Sort the posts retrieved back into reading order and return them
  const postsById = keyBy(posts, post=>post._id);
  return _.map(allPostIds, id=>postsById[id]);
}
