/*

Callbacks to:

- Increment a user's post count
- Run post approved callbacks
- Update a user's post count
- Remove a user's posts when it's deleted
- Track clicks

*/

import { Posts } from '../../../lib/collections/posts';
import { postIsApproved } from '../../../lib/collections/posts/helpers';
import { addCallback, runCallbacks, runCallbacksAsync } from '../../vulcan-lib';
import { getCollectionHooks } from '../../mutationCallbacks';

//////////////////////////////////////////////////////
// posts.edit.sync                                  //
//////////////////////////////////////////////////////

getCollectionHooks("Posts").editSync.add(function PostsEditRunPostApprovedSyncCallbacks(modifier, post) {
  if (modifier.$set && postIsApproved(modifier.$set) && !postIsApproved(post)) {
    modifier = runCallbacks({
      name: 'posts.approve.sync',
      iterator: modifier,
      properties: [post]
    });
  }
  return modifier;
});

//////////////////////////////////////////////////////
// posts.edit.async                                 //
//////////////////////////////////////////////////////

getCollectionHooks("Posts").editAsync.add(function PostsEditRunPostApprovedAsyncCallbacks(post, oldPost) {
  if (postIsApproved(post) && !postIsApproved(oldPost)) {
    runCallbacksAsync({
      name: 'posts.approve.async',
      properties: [post]
    });
  }
});


//////////////////////////////////////////////////////
// posts.approve.sync                              //
//////////////////////////////////////////////////////

function PostsApprovedSetPostedAt(modifier, post) {
  modifier.$set.postedAt = new Date();
  return modifier;
}
addCallback('posts.approve.sync', PostsApprovedSetPostedAt);
