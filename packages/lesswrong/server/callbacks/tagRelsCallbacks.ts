import { getCollectionHooks } from '../mutationCallbacks';
import { Tags } from '../../lib/collections/tags/collection';

getCollectionHooks("TagRels").createBefore.add(async (tagrel: DbTagRel) => {
  const tag = await Tags.findOne({_id: tagrel.tagId});
  if (!tag) {
    throw new Error("Tag not found");
  }
  if (tag.canVoteOnRels) {
    tagrel.canVote = tag.canVoteOnRels;
  }
  return tagrel;
});
