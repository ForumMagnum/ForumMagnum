import { registerCollectionValidator } from '../scripts/validateDatabase';
import { createAdminContext } from '../vulcan-lib/createContexts';
import { Posts } from '../../server/collections/posts/collection';
import { sequenceGetAllPosts } from '@/lib/collections/sequences/sequenceServerHelpers';
import * as _ from 'underscore';

registerCollectionValidator({
  collection: Posts,
  name: "Canonical sequence contains post",
  validateBatch: async (documents: DbPost[], recordError: (field: string, message: string) => void) => {
    const context = createAdminContext();
    for (let post of documents) {
      // If the post has a canonicalSequenceId, make sure that sequence contains the post
      if (post.canonicalSequenceId) {
        let postsInSequence = await sequenceGetAllPosts(post.canonicalSequenceId, context);
        let idsInSequence = _.map(postsInSequence, post=>post._id);
        if (!_.find(idsInSequence, id=>id===post._id))
          recordError("canonicalSequenceId", `${post._id} is not contained by its canonical sequence`);
      }
    }
  }
});
