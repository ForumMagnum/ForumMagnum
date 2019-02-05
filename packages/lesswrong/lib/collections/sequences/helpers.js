import Sequences from './collection.js';
import { Posts } from '../posts/index.js';
import Chapters from '../chapters/collection.js';

import { Utils } from 'meteor/vulcan:core';

Sequences.getPageUrl = function(sequence, isAbsolute = false){
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

Sequences.getAllPosts = async (sequenceId) => {
  const chapters = await Chapters.find({sequenceId: sequenceId}).fetch()
  let allPostsIds = _.flatten(_.pluck(chapters, 'postIds'))
  return await Posts.find({_id:{$in:allPostsIds}}).fetch()
}