import { TagRels } from '../../lib/collections/tagRels/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { isElasticEnabled } from '../search/elastic/elasticSettings';

export async function updatePostDenormalizedTags(postId: string) {
  if (!postId) {
    // eslint-disable-next-line no-console
    console.warn("Warning: Trying to update tagRelevance with an invalid post ID:", postId);
    return;
  }

  const tagRels: Array<DbTagRel> = await TagRels.find({postId, deleted: false}).fetch();
  const tagRelDict: Record<string, number> = {};

  for (let tagRel of tagRels) {
    if (tagRel.baseScore > 0)
      tagRelDict[tagRel.tagId] = tagRel.baseScore;
  }

  await Posts.rawUpdateOne({_id:postId}, {$set: {tagRelevance: tagRelDict}});
  if (isElasticEnabled) {
    void elasticSyncDocument("Posts", postId);
  }
}
