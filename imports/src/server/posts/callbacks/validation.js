/*

Post validation and rate limiting callbacks

*/

import { Posts } from '../../../lib/collections/posts'
import Users from 'vulcan:users';
import { addCallback, getSetting } from 'vulcan:core';
import { createError } from 'apollo-errors';


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
      const RateLimitError = createError('posts.rate_limit_error', {message: 'posts.rate_limit_error'});
      throw new RateLimitError({data: {break: true, id: 'posts.rate_limit_error', properties: { value: postInterval-timeSinceLastPost }}});

    }
    // check that the user doesn't post more than Y posts per day
    if(numberOfPostsInPast24Hours >= maxPostsPer24Hours){
      const RateLimitError = createError('posts.max_per_day', {message: 'posts.max_per_day'});
      throw new RateLimitError({data: {break: true, id: 'posts.max_per_day', properties: { value: maxPostsPer24Hours }}});
    }
  }

  return post;
}
addCallback('posts.new.validate', PostsNewRateLimit);
