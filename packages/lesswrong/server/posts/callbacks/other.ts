import { postIsApproved } from '../../../lib/collections/posts/helpers';
import { getCollectionHooks } from '../../mutationCallbacks';

getCollectionHooks("Posts").editSync.add(function PostsEditRunPostApprovedSyncCallbacks(modifier, post) {
  if (modifier.$set && postIsApproved(modifier.$set) && !postIsApproved(post)) {
    modifier.$set.postedAt = new Date();
  }
  return modifier;
});
