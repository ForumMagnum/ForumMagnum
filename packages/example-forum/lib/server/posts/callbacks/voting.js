/*

Voting callbacks

*/

import { Posts } from '../../../modules/posts/index.js';
import Users from 'meteor/vulcan:users';
import { addCallback } from 'meteor/vulcan:core';
import { performVoteServer } from 'meteor/vulcan:voting';

/**
 * @summary Make users upvote their own new posts
 */
function PostsNewUpvoteOwnPost(post) {
  var postAuthor = Users.findOne(post.userId);
  const serverVote = performVoteServer({ document: post, voteType: 'upvote', collection: Posts, user: postAuthor });
  console.log("PostsNewUpvoteOwnPost serverVote", serverVote);
  return {...post, ...serverVote};
}

addCallback('posts.new.after', PostsNewUpvoteOwnPost);
