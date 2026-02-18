import { canVoteOnTag } from "../../voting/tagRelVoteRules";
import { CoauthoredPost } from "../posts/helpers";

type TagWithVotePermissons = Pick<TagPreviewFragment, "slug" | "canVoteOnRels" | "authorOnly">;

export const shouldHideTagForVoting = (
  user: UsersCurrent | null,
  tag: TagWithVotePermissons,
  post: {userId?: string|null} & CoauthoredPost|null,
) => canVoteOnTag(tag?.canVoteOnRels, tag?.authorOnly ?? false, user, post, 'smallUpvote').fail;
