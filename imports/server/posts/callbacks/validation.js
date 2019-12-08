/*

Post validation and rate limiting callbacks

*/

import { Posts } from '../../../lib/collections/posts'
import Users from 'meteor/vulcan:users';
import { addCallback, getSetting } from 'meteor/vulcan:core';


/**
 * @summary Rate limiting
 */
function PostsNewRateLimit (post, user) {
  if(!Users.isAdmin(user)){
    var timeSinceLastPost = Users.timeSinceLast(user, Posts),
      numberOfPostsInPast24Hours = Users.numberOfItemsInPast24Hours(user, Posts),
      postInterval = Math.abs(parseInt(getSetting('forum.postInterval', 30))),
      maxPostsPer24Hours = Math.abs(parseInt(getSetting('forum.maxPostsPerDay', 5)));

    // check that user waits more than X seconds between posts
    if(timeSinceLastPost < postInterval){
      throw new Error(`Please wait ${postInterval-timeSinceLastPost} seconds before posting again.`);
    }
    // check that the user doesn't post more than Y posts per day
    if(numberOfPostsInPast24Hours >= maxPostsPer24Hours){
      throw new Error(`Sorry, you cannot submit more than ${maxPostsPer24Hours} posts per day.`);
    }
  }

  return post;
}
addCallback('posts.new.validate', PostsNewRateLimit);
