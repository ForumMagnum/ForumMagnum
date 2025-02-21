import { membersGroup } from "@/lib/vulcan-users/permissions.ts";
import { canVoteOnTag } from "../../voting/tagRelVoteRules";
import { CoauthoredPost } from "../posts/helpers";

type TagWithVotePermissons = Pick<TagPreviewFragment, "slug" | "canVoteOnRels">;

export const shouldHideTagForVoting = (
  user: UsersCurrent | null,
  tag: TagWithVotePermissons,
  post: {userId?: string} & CoauthoredPost|null,
) => canVoteOnTag(tag?.canVoteOnRels, user, post, 'smallUpvote').fail;

membersGroup.can([
  'tags.smallDownvote',
  'tags.bigDownvote',
  'tags.smallUpvote',
  'tags.bigUpvote',
]);
