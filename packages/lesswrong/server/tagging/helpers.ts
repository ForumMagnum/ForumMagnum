import { TagRels } from '../../server/collections/tagRels/collection';
import { Posts } from '../../server/collections/posts/collection';
import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { isElasticEnabled } from '../../lib/instanceSettings';
import { backgroundTask } from '../utils/backgroundTask';

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
    backgroundTask(elasticSyncDocument("Posts", postId));
  }
}
