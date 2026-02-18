import { TagRels } from '../../server/collections/tagRels/collection';
import { Posts } from '../../server/collections/posts/collection';
import { Tags } from '../../server/collections/tags/collection';
import { Votes } from '../../server/collections/votes/collection';
import { Users } from '../../server/collections/users/collection';
import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { isElasticEnabled } from '../../lib/instanceSettings';
import { backgroundTask } from '../utils/backgroundTask';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';

const TAG_REL_UPVOTE_TYPES = new Set(["smallUpvote", "bigUpvote"]);
const TAG_REL_DOWNVOTE_TYPES = new Set(["smallDownvote", "bigDownvote"]);
const HIGH_KARMA_REMOVAL_THRESHOLD = 2000;

const isHighKarmaUser = (user: DbUser) => {
  if (!user) return false;
  if ((user.karma ?? 0) >= HIGH_KARMA_REMOVAL_THRESHOLD) {
    return true;
  }
  return user.groups?.includes("trustLevel1") ?? false;
};

export async function updatePostDenormalizedTags(postId: string) {
  if (!postId) {
    // eslint-disable-next-line no-console
    console.warn("Warning: Trying to update tagRelevance with an invalid post ID:", postId);
    return;
  }

  const tagRels: Array<DbTagRel> = await TagRels.find({postId, deleted: false}).fetch();
  const tagRelDict: Record<string, number> = {};
  const tagIds = tagRels.map((tagRel) => tagRel.tagId);
  const removalResistantTags = tagIds.length
    ? await Tags.find({ _id: { $in: tagIds }, removalResistant: true }).fetch()
    : [];
  const removalResistantTagIds = new Set(removalResistantTags.map((tag) => tag._id));
  const removalResistantTagRelIds = tagRels
    .filter((tagRel) => removalResistantTagIds.has(tagRel.tagId))
    .map((tagRel) => tagRel._id);
  const tagRelVoteStatus = new Map<string, { hasProtectedUpvote: boolean; hasModeratorDownvote: boolean }>();

  if (removalResistantTagRelIds.length) {
    const votes = await Votes.find({
      collectionName: "TagRels",
      documentId: { $in: removalResistantTagRelIds },
      cancelled: { $ne: true },
      isUnvote: { $ne: true },
      voteType: { $in: [...TAG_REL_UPVOTE_TYPES, ...TAG_REL_DOWNVOTE_TYPES] },
    }, {
      projection: {
        documentId: 1,
        userId: 1,
        voteType: 1,
      },
    }).fetch();

    const voterIds = Array.from(new Set(votes.map((vote) => vote.userId).filter(Boolean)));
    const voters = voterIds.length
      ? await Users.find({ _id: { $in: voterIds } }, { projection: { _id: 1, karma: 1, groups: 1, isAdmin: 1, banned: 1 } }).fetch()
      : [];
    const votersById = new Map(voters.map((user) => [user._id, user]));

    for (const vote of votes) {
      const voter = votersById.get(vote.userId);
      if (!voter) continue;
      const isModerator = userIsAdminOrMod(voter);
      const isProtectedUpvote = TAG_REL_UPVOTE_TYPES.has(vote.voteType) && (isModerator || isHighKarmaUser(voter));
      const isModeratorDownvote = TAG_REL_DOWNVOTE_TYPES.has(vote.voteType) && isModerator;

      if (!isProtectedUpvote && !isModeratorDownvote) {
        continue;
      }

      const existing = tagRelVoteStatus.get(vote.documentId) ?? {
        hasProtectedUpvote: false,
        hasModeratorDownvote: false,
      };

      tagRelVoteStatus.set(vote.documentId, {
        hasProtectedUpvote: existing.hasProtectedUpvote || isProtectedUpvote,
        hasModeratorDownvote: existing.hasModeratorDownvote || isModeratorDownvote,
      });
    }
  }

  for (let tagRel of tagRels) {
    const baseScore = tagRel.baseScore ?? 0;
    const voteStatus = tagRelVoteStatus.get(tagRel._id);
    const isRemovalResistant = removalResistantTagIds.has(tagRel.tagId);
    const shouldProtect = isRemovalResistant
      && (voteStatus?.hasProtectedUpvote ?? false)
      && !(voteStatus?.hasModeratorDownvote ?? false);
    const effectiveScore = shouldProtect ? Math.max(1, baseScore) : baseScore;

    if (effectiveScore > 0) {
      tagRelDict[tagRel.tagId] = effectiveScore;
    }
  }

  await Posts.rawUpdateOne({_id:postId}, {$set: {tagRelevance: tagRelDict}});
  if (isElasticEnabled()) {
    backgroundTask(elasticSyncDocument("Posts", postId));
  }
}
