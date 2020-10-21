/*

Callbacks to:

- Increment a user's post count
- Run post approved callbacks
- Update a user's post count
- Remove a user's posts when it's deleted
- Track clicks

*/

import { Posts } from '../../../lib/collections/posts';
import { addCallback, Connectors, runCallbacks, runCallbacksAsync } from '../../vulcan-lib';

//////////////////////////////////////////////////////
// posts.edit.sync                                  //
//////////////////////////////////////////////////////

function PostsEditRunPostApprovedSyncCallbacks(modifier, post) {
  if (modifier.$set && Posts.isApproved(modifier.$set) && !Posts.isApproved(post)) {
    modifier = runCallbacks({
      name: 'posts.approve.sync',
      iterator: modifier,
      properties: [post]
    });
  }
  return modifier;
}
addCallback('posts.edit.sync', PostsEditRunPostApprovedSyncCallbacks);

//////////////////////////////////////////////////////
// posts.edit.async                                 //
//////////////////////////////////////////////////////

function PostsEditRunPostApprovedAsyncCallbacks(post, oldPost) {
  if (Posts.isApproved(post) && !Posts.isApproved(oldPost)) {
    runCallbacksAsync({
      name: 'posts.approve.async',
      properties: [post]
    });
  }
}
addCallback('posts.edit.async', PostsEditRunPostApprovedAsyncCallbacks);

//////////////////////////////////////////////////////
// users.remove.async                               //
//////////////////////////////////////////////////////

function UsersRemoveDeletePosts(user, options) {
  if (options.deletePosts) {
    Posts.remove({ userId: user._id });
  } else {
    // not sure if anything should be done in that scenario yet
    // Posts.update({userId: userId}, {$set: {author: '\[deleted\]'}}, {multi: true});
  }
}
addCallback('users.remove.async', UsersRemoveDeletePosts);

//////////////////////////////////////////////////////
// posts.click.async                                //
//////////////////////////////////////////////////////

// /**
//  * @summary Increase the number of clicks on a post
//  * @param {string} postId – the ID of the post being edited
//  * @param {string} ip – the IP of the current user
//  */

async function PostsClickTracking(post, ip) {
  await Connectors.update(Posts, post._id, { $inc: { clickCount: 1 } });
}

// track links clicked, locally in Events collection
// note: this event is not sent to segment cause we cannot access the current user
// in our server-side route /out -> sending an event would create a new anonymous
// user: the free limit of 1,000 unique users per month would be reached quickly
addCallback('posts.click.async', PostsClickTracking);

//////////////////////////////////////////////////////
// posts.approve.sync                              //
//////////////////////////////////////////////////////

function PostsApprovedSetPostedAt(modifier, post) {
  modifier.$set.postedAt = new Date();
  return modifier;
}
addCallback('posts.approve.sync', PostsApprovedSetPostedAt);
