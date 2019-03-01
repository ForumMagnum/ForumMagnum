import { registerCollectionValidator } from '../../../server/scripts/validateDatabase.js';
import { Posts } from './collection.js';
import { Sequences } from '../sequences/collection.js';

registerCollectionValidator({
  collection: Posts,
  name: "Canonical sequence contains post",
  validateBatch: async (documents, recordError) => {
    for (let post of documents) {
      // If the post has a canonicalSequenceId, make sure that sequence contains the post
      if (post.canonicalSequenceId) {
        let postsInSequence = await Sequences.getAllPosts(post.canonicalSequenceId);
        let idsInSequence = _.map(postsInSequence, post=>post._id);
        if (!_.find(idsInSequence, id=>id===post._id))
          recordError("canonicalSequenceId", `${post._id} is not contained by its canonical sequence`);
      }
    }
  }
});
