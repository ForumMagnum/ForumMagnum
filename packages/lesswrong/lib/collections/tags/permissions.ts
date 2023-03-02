import { canVoteOnTag } from "../../voting/tagRelVoteRules";
import { CoauthoredPost } from "../posts/helpers";

type TagWithVotePermissons = Pick<TagPreviewFragment, "slug" | "canVoteOnRels">;

export const shouldHideTag = (
  user: UsersCurrent | null,
  tag: TagWithVotePermissons,
  post: {userId?: string} & CoauthoredPost|null,
) => !canVoteOnTag(tag?.canVoteOnRels, user, post);
